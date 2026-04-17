import type { ShellMember, WorkspaceConfig, WorkspaceMeta } from '@dashway/config-schema'

interface SessionState {
  member: ShellMember | null
  accessToken: string | null
  refreshToken: string | null
  workspaces: WorkspaceMeta[]
  activeWorkspaceId: string | null
  workspaceConfig: WorkspaceConfig | null
}

const createInitialState = (): SessionState => ({
  member: null,
  accessToken: null,
  refreshToken: null,
  workspaces: [],
  activeWorkspaceId: null,
  workspaceConfig: null,
})

let currentSession = createInitialState()

export const sessionStore = {
  get(): SessionState {
    return currentSession
  },

  hasAuthenticatedSession(): boolean {
    return Boolean(currentSession.member && currentSession.accessToken && currentSession.refreshToken)
  },

  setAuthenticatedSession(session: {
    member: ShellMember
    accessToken: string
    refreshToken: string
  }, options?: {
    preserveShellSnapshot?: boolean
  }): void {
    const snapshot = options?.preserveShellSnapshot
      ? {
          workspaces: currentSession.workspaces,
          activeWorkspaceId: currentSession.activeWorkspaceId,
          workspaceConfig: currentSession.workspaceConfig,
        }
      : {
          workspaces: [],
          activeWorkspaceId: null,
          workspaceConfig: null,
        }

    currentSession = {
      ...createInitialState(),
      ...snapshot,
      member: session.member,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    }
  },

  setShellSnapshot(snapshot: {
    workspaces: WorkspaceMeta[]
    activeWorkspaceId: string | null
    workspaceConfig: WorkspaceConfig
  }): void {
    currentSession = {
      ...currentSession,
      workspaces: snapshot.workspaces,
      activeWorkspaceId: snapshot.activeWorkspaceId,
      workspaceConfig: snapshot.workspaceConfig,
    }
  },

  setActiveWorkspace(workspaceId: string | null): void {
    currentSession = {
      ...currentSession,
      activeWorkspaceId: workspaceId,
    }
  },

  setWorkspaceConfig(workspaceConfig: WorkspaceConfig): void {
    currentSession = {
      ...currentSession,
      workspaceConfig,
    }
  },

  clear(): void {
    currentSession = createInitialState()
  },
}
