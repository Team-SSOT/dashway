import type { ShellBootstrapResult, ThemeMode, WorkspaceMeta } from '@dashway/config-schema'
import {
  contextApiClient,
  getGraphqlErrorMessage,
  isAuthenticationRequiredError,
} from './context-api-client'
import { configStore } from './config-store'
import { sessionStore } from './session-store'
import { loadWorkspaceConfig } from './workspace-loader'

const SHELL_BOOTSTRAP_TEAMS_QUERY = `
  query ShellBootstrapTeams($page: Int!, $size: Int!) {
    teams(page: $page, size: $size) {
      teams {
        id
        name
      }
    }
  }
`

interface TeamSummary {
  id: string | number
  name: string
}

interface TeamsQueryData {
  teams?: {
    teams?: TeamSummary[]
  }
}

function getInitialTheme(): ThemeMode {
  return configStore.get<ThemeMode>('theme', 'dark')
}

function toWorkspace(team: TeamSummary): WorkspaceMeta {
  const trimmedName = team.name.trim()

  return {
    id: String(team.id),
    name: trimmedName,
    icon: trimmedName.charAt(0).toUpperCase() || 'W',
  }
}

function resolveActiveWorkspaceId(
  workspaces: WorkspaceMeta[],
  currentWorkspaceId: string | null,
): string | null {
  if (currentWorkspaceId && workspaces.some((workspace) => workspace.id === currentWorkspaceId)) {
    return currentWorkspaceId
  }

  return workspaces[0]?.id ?? null
}

export async function buildShellBootstrap(): Promise<ShellBootstrapResult> {
  const initialTheme = getInitialTheme()

  if (!sessionStore.hasAuthenticatedSession()) {
    return {
      status: 'unauthenticated',
      initialTheme,
    }
  }

  const response = await contextApiClient.graphql({
    query: SHELL_BOOTSTRAP_TEAMS_QUERY,
    variables: {
      page: 0,
      size: 100,
    },
    operationName: 'ShellBootstrapTeams',
  })

  if (isAuthenticationRequiredError(response)) {
    return {
      status: 'unauthenticated',
      initialTheme,
    }
  }

  if (response.errors?.length) {
    throw new Error(getGraphqlErrorMessage(response, 'Could not load shell bootstrap data.'))
  }

  const teams = ((response.data as TeamsQueryData | undefined)?.teams?.teams ?? []).map(toWorkspace)
  const workspaceConfig = await loadWorkspaceConfig()

  if (!workspaceConfig) {
    return {
      status: 'unauthenticated',
      initialTheme,
    }
  }

  const activeWorkspaceId = resolveActiveWorkspaceId(teams, sessionStore.get().activeWorkspaceId)

  sessionStore.setShellSnapshot({
    workspaces: teams,
    activeWorkspaceId,
    workspaceConfig,
  })

  const session = sessionStore.get()

  if (!session.member) {
    return {
      status: 'unauthenticated',
      initialTheme,
    }
  }

  return {
    status: 'ready',
    initialTheme,
    member: session.member,
    workspaces: teams,
    activeWorkspaceId,
    workspaceConfig,
  }
}
