import type {
  ShellBootstrapReadyResult,
  ShellBootstrapResult,
  ShellGraphqlRequest,
  ShellGraphqlResponse,
  ShellLoginInput,
  ShellMember,
  ShellSignupInput,
  ThemeMode,
  WorkspaceConfig,
} from '@dashway/config-schema'

export interface ServerProbeResult {
  ok: boolean
  error?: string
}

export interface ShellAPI {
  getBootstrap(): Promise<ShellBootstrapResult>
  login(input: ShellLoginInput): Promise<ShellBootstrapReadyResult>
  signup(input: ShellSignupInput): Promise<ShellMember>
  logout(): Promise<void>
  graphql(request: ShellGraphqlRequest): Promise<ShellGraphqlResponse>
  setTheme(mode: ThemeMode): Promise<void>
  getServerUrl(): Promise<string>
  setServerUrl(url: string): Promise<void>
  probeServer(url: string): Promise<ServerProbeResult>
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

export interface AppManifestFetchResult {
  ok: boolean
  manifest?: unknown
  error?: string
}

export interface AppManifestAPI {
  fetch(url: string): Promise<AppManifestFetchResult>
}

export interface DesktopAPI {
  shell: ShellAPI
  workspace: WorkspaceAPI
  window: WindowAPI
  events: EventsAPI
  appManifest: AppManifestAPI
}
