import type {
  ShellGraphqlRequest,
  ShellGraphqlResponse,
  ShellLoginInput,
  ShellMember,
  ShellSignupInput,
} from '@dashway/config-schema'
import { IPC } from '../ipc/channels'
import { windowManager } from '../window-manager'
import { configStore } from './config-store'
import { sessionStore } from './session-store'

const AUTHENTICATION_REQUIRED_MESSAGE = 'Authentication is required.'
const DEFAULT_CONTEXT_API_URL = 'http://localhost:8080/graphql'
const CONTEXT_API_URL_KEY = 'contextApiUrl'

const AUTH_MEMBER_FIELDS = `
  id
  name
  email
  isEnabled
  authorities {
    name
  }
`

const LOGIN_MUTATION = `
  mutation ShellLogin($input: LoginInput!) {
    login(input: $input) {
      member {
        ${AUTH_MEMBER_FIELDS}
      }
      tokens {
        accessToken
      }
    }
  }
`

const REFRESH_MUTATION = `
  mutation ShellRefresh {
    refresh {
      member {
        ${AUTH_MEMBER_FIELDS}
      }
      tokens {
        accessToken
      }
    }
  }
`

const LOGOUT_MUTATION = `
  mutation ShellLogout {
    logout
  }
`

const REGISTER_MEMBER_MUTATION = `
  mutation ShellRegisterMember($input: RegisterMemberInput!) {
    registerMember(input: $input) {
      id
      name
      email
      isEnabled
      authorities {
        name
      }
    }
  }
`

interface AuthOperationMember {
  id: string | number
  name: string
  email: string
  isEnabled: boolean
  authorities?: Array<{ name: string }>
}

interface AuthOperationPayload {
  member: AuthOperationMember
  tokens: {
    accessToken: string
  }
}

interface GraphqlHttpResult {
  response: ShellGraphqlResponse
  refreshToken: string | null
}

function getContextApiUrl(): string {
  const envUrl = process.env.DASHWAY_CONTEXT_API_URL
  if (envUrl) {
    return envUrl
  }

  return configStore.get<string>(CONTEXT_API_URL_KEY, '') || DEFAULT_CONTEXT_API_URL
}

function getStoredContextApiUrl(): string {
  return process.env.DASHWAY_CONTEXT_API_URL ?? configStore.get<string>(CONTEXT_API_URL_KEY, '')
}

function setStoredContextApiUrl(url: string): void {
  configStore.set<string>(CONTEXT_API_URL_KEY, url)
}

async function probeContextApiUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    })

    if (!response.ok) {
      return { ok: false, error: `Server responded with ${response.status}.` }
    }

    const body = (await response.json()) as ShellGraphqlResponse
    if (body.errors?.length && !body.data) {
      return { ok: false, error: body.errors[0]?.message ?? 'GraphQL error.' }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not reach the server.',
    }
  }
}

function getGraphqlErrorMessage(
  response: ShellGraphqlResponse,
  fallback = 'Context API request failed.',
): string {
  return response.errors?.[0]?.message ?? fallback
}

function isAuthenticationRequiredError(response: ShellGraphqlResponse): boolean {
  return response.errors?.some((error) => error.message === AUTHENTICATION_REQUIRED_MESSAGE) ?? false
}

function buildAuthErrorResponse(): ShellGraphqlResponse {
  return {
    errors: [{ message: AUTHENTICATION_REQUIRED_MESSAGE }],
  }
}

function toShellMember(member: AuthOperationMember): ShellMember {
  return {
    id: String(member.id),
    name: member.name,
    email: member.email,
    authorities: member.authorities?.map((authority) => authority.name) ?? [],
    isEnabled: member.isEnabled,
  }
}

function extractRefreshToken(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null
  }

  const match = setCookieHeader.match(/(?:^|,\s*)Refresh=([^;,]+)/)
  return match?.[1] ?? null
}

async function executeRequest(
  request: ShellGraphqlRequest,
  options?: {
    accessToken?: string | null
    refreshToken?: string | null
  },
): Promise<GraphqlHttpResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  if (options?.refreshToken) {
    headers.Cookie = `Refresh=${options.refreshToken}`
  }

  let httpResponse: Response

  try {
    httpResponse = await fetch(getContextApiUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: request.query,
        variables: request.variables,
        operationName: request.operationName,
      }),
    })
  } catch {
    throw new Error('Could not reach Context API.')
  }

  let response: ShellGraphqlResponse

  try {
    response = (await httpResponse.json()) as ShellGraphqlResponse
  } catch {
    throw new Error('Context API returned invalid JSON.')
  }

  return {
    response,
    refreshToken: extractRefreshToken(httpResponse.headers.get('set-cookie')),
  }
}

function invalidateSession(options?: { silent?: boolean }): void {
  const hadSession = sessionStore.hasAuthenticatedSession()
  sessionStore.clear()

  if (!options?.silent && hadSession) {
    windowManager.getMainWindow()?.webContents.send(IPC.EVENT_SESSION_INVALIDATED)
  }
}

function getAuthPayload(
  response: ShellGraphqlResponse,
  operation: 'login' | 'refresh',
): AuthOperationPayload | null {
  const data = response.data as
    | {
        login?: AuthOperationPayload
        refresh?: AuthOperationPayload
      }
    | undefined

  return data?.[operation] ?? null
}

async function refreshSession(): Promise<boolean> {
  const session = sessionStore.get()

  if (!session.refreshToken) {
    invalidateSession()
    return false
  }

  try {
    const result = await executeRequest(
      {
        query: REFRESH_MUTATION,
        operationName: 'ShellRefresh',
      },
      {
        refreshToken: session.refreshToken,
      },
    )

    if (result.response.errors?.length) {
      invalidateSession()
      return false
    }

    const payload = getAuthPayload(result.response, 'refresh')

    if (!payload?.tokens.accessToken || !result.refreshToken) {
      invalidateSession()
      return false
    }

    sessionStore.setAuthenticatedSession({
      member: toShellMember(payload.member),
      accessToken: payload.tokens.accessToken,
      refreshToken: result.refreshToken,
    }, {
      preserveShellSnapshot: true,
    })

    return true
  } catch {
    invalidateSession()
    return false
  }
}

interface RegisterMemberPayload {
  id: string | number
  name: string
  email: string
  isEnabled: boolean
  authorities?: Array<{ name: string }>
}

export const contextApiClient = {
  async signup(input: ShellSignupInput): Promise<ShellMember> {
    const result = await executeRequest({
      query: REGISTER_MEMBER_MUTATION,
      variables: {
        input: {
          name: input.name.trim(),
          email: input.email.trim(),
          password: input.password,
          isEnabled: true,
        },
      },
      operationName: 'ShellRegisterMember',
    })

    if (result.response.errors?.length) {
      throw new Error(getGraphqlErrorMessage(result.response, 'Sign-up failed.'))
    }

    const data = result.response.data as { registerMember?: RegisterMemberPayload } | undefined
    const member = data?.registerMember

    if (!member) {
      throw new Error('Context API sign-up response was incomplete.')
    }

    return toShellMember(member)
  },

  async login(input: ShellLoginInput): Promise<void> {
    const result = await executeRequest({
      query: LOGIN_MUTATION,
      variables: {
        input: {
          email: input.email.trim(),
          password: input.password,
        },
      },
      operationName: 'ShellLogin',
    })

    if (result.response.errors?.length) {
      throw new Error(getGraphqlErrorMessage(result.response, 'Login failed.'))
    }

    const payload = getAuthPayload(result.response, 'login')

    if (!payload?.tokens.accessToken || !result.refreshToken) {
      throw new Error('Context API login response was incomplete.')
    }

    sessionStore.setAuthenticatedSession({
      member: toShellMember(payload.member),
      accessToken: payload.tokens.accessToken,
      refreshToken: result.refreshToken,
    })
  },

  async logout(): Promise<void> {
    const session = sessionStore.get()

    try {
      if (session.accessToken && session.refreshToken) {
        await executeRequest(
          {
            query: LOGOUT_MUTATION,
            operationName: 'ShellLogout',
          },
          {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
          },
        )
      }
    } finally {
      sessionStore.clear()
    }
  },

  async graphql(request: ShellGraphqlRequest): Promise<ShellGraphqlResponse> {
    const session = sessionStore.get()

    if (!session.accessToken || !session.refreshToken) {
      return buildAuthErrorResponse()
    }

    const initialResult = await executeRequest(request, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    })

    if (!isAuthenticationRequiredError(initialResult.response)) {
      return initialResult.response
    }

    const refreshed = await refreshSession()

    if (!refreshed) {
      return buildAuthErrorResponse()
    }

    const refreshedSession = sessionStore.get()

    if (!refreshedSession.accessToken || !refreshedSession.refreshToken) {
      return buildAuthErrorResponse()
    }

    const retryResult = await executeRequest(request, {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
    })

    if (isAuthenticationRequiredError(retryResult.response)) {
      invalidateSession()
      return buildAuthErrorResponse()
    }

    return retryResult.response
  },
}

export {
  AUTHENTICATION_REQUIRED_MESSAGE,
  getGraphqlErrorMessage,
  getStoredContextApiUrl,
  isAuthenticationRequiredError,
  probeContextApiUrl,
  setStoredContextApiUrl,
}
