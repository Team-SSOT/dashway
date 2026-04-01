import type { WorkspaceConfig } from '@dashway/config-schema'

export function loadWorkspaceConfig(): WorkspaceConfig {
  // TODO: load from disk or remote
  return {
    enabledApps: ['home', 'chat', 'tasks'],
    navOrder: ['home', 'chat', 'tasks'],
    defaultApp: 'home',
    theme: 'dark',
  }
}
