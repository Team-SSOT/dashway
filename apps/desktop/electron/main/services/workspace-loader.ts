import type { ThemeMode, WorkspaceApp, WorkspaceConfig } from '@dashway/config-schema'
import {
  contextApiClient,
  getGraphqlErrorMessage,
  isAuthenticationRequiredError,
} from './context-api-client'
import { configStore } from './config-store'

const DEFAULT_REMOTE_APP_HOST = '127.0.0.1'
const DEFAULT_REMOTE_APP_PROTOCOL = 'http'

const WORKSPACE_APPS_QUERY = `
  query ShellWorkspaceApps($page: Int!, $size: Int!) {
    apps(page: $page, size: $size) {
      apps {
        id
        name
        port
        isEnabled
      }
    }
  }
`

interface WorkspaceAppSummary {
  id: string | number
  name: string
  port: number
  isEnabled: boolean
}

interface WorkspaceAppsQueryData {
  apps?: {
    apps?: WorkspaceAppSummary[]
  }
}

function getRemoteAppOrigin(): string {
  const protocol = process.env.DASHWAY_REMOTE_APP_PROTOCOL ?? DEFAULT_REMOTE_APP_PROTOCOL
  const host = process.env.DASHWAY_REMOTE_APP_HOST ?? DEFAULT_REMOTE_APP_HOST

  return `${protocol}://${host}`
}

function deriveAppIcon(name: string): string {
  const normalized = name.trim().toLowerCase()

  if (normalized.includes('home')) {
    return 'house'
  }

  if (normalized.includes('chat') || normalized.includes('message')) {
    return 'message-circle'
  }

  if (normalized.includes('task')) {
    return 'square-check-big'
  }

  return 'layout-grid'
}

function toWorkspaceApp(app: WorkspaceAppSummary): WorkspaceApp {
  const trimmedName = app.name.trim()
  const title = trimmedName || `App ${String(app.id).slice(0, 8)}`

  return {
    id: String(app.id),
    title,
    icon: deriveAppIcon(title),
    entryUrl: `${getRemoteAppOrigin()}:${app.port}`,
  }
}

export async function loadWorkspaceConfig(): Promise<WorkspaceConfig | null> {
  const response = await contextApiClient.graphql({
    query: WORKSPACE_APPS_QUERY,
    variables: {
      page: 0,
      size: 100,
    },
    operationName: 'ShellWorkspaceApps',
  })

  if (isAuthenticationRequiredError(response)) {
    return null
  }

  if (response.errors?.length) {
    throw new Error(getGraphqlErrorMessage(response, 'Could not load remote app configuration.'))
  }

  const apps = (((response.data as WorkspaceAppsQueryData | undefined)?.apps?.apps ?? [])
    .filter((app) => app.isEnabled)
    .map(toWorkspaceApp))

  const appIds = apps.map((app) => app.id)

  return {
    apps,
    enabledApps: appIds,
    navOrder: appIds,
    defaultApp: appIds[0] ?? null,
    theme: configStore.get<ThemeMode>('theme', 'dark'),
  }
}
