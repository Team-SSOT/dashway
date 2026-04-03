import type {
  ShellBootstrapReadyResult,
  ShellBootstrapResult,
  ShellGraphqlRequest,
  ShellGraphqlResponse,
  ShellLoginInput,
  ThemeMode,
  WorkspaceConfig,
} from '@dashway/config-schema'

export interface ShellAPI {
  getBootstrap(): Promise<ShellBootstrapResult>
  login(input: ShellLoginInput): Promise<ShellBootstrapReadyResult>
  logout(): Promise<void>
  graphql(request: ShellGraphqlRequest): Promise<ShellGraphqlResponse>
  setTheme(mode: ThemeMode): Promise<void>
}

export interface WorkspaceAPI {
  getConfig(): Promise<WorkspaceConfig>
  switchWorkspace(workspaceId: string): Promise<WorkspaceConfig>
  onConfigChanged(callback: (config: WorkspaceConfig) => void): () => void
}

export interface WindowAPI {
  minimize(): Promise<void>
  maximize(): Promise<void>
  close(): Promise<void>
}

export interface EventsAPI {
  onDeepLink(callback: (url: string) => void): () => void
  onSessionInvalidated(callback: () => void): () => void
  onWindowFocus(callback: () => void): () => void
  onWindowBlur(callback: () => void): () => void
}

export interface DesktopAPI {
  shell: ShellAPI
  workspace: WorkspaceAPI
  window: WindowAPI
  events: EventsAPI
}
