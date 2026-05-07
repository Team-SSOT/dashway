import type {
  ShellBootstrapReadyResult,
  ShellMember,
  WorkspaceConfig,
  WorkspaceMeta,
} from '@dashway/config-schema'
import { create } from 'zustand'

interface ShellState {
  activeAppId: string | null
  sidebarCollapsed: boolean
  rightPanelOpen: boolean
  rightPanelContent: 'details' | 'ai' | 'settings' | null
  commandPaletteOpen: boolean

  currentMember: ShellMember | null
  activeWorkspaceId: string | null
  workspaces: WorkspaceMeta[]
  workspaceConfig: WorkspaceConfig | null

  lastKnownAppRoute: Record<string, string>

  hydrateBootstrap: (payload: ShellBootstrapReadyResult) => void
  clearSession: () => void
  setActiveApp: (id: string | null) => void
  toggleSidebar: () => void
  toggleRightPanel: (content?: 'details' | 'ai' | 'settings') => void
  closeRightPanel: () => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void

  setWorkspaces: (workspaces: WorkspaceMeta[]) => void
  setActiveWorkspace: (id: string | null) => void
  setWorkspaceConfig: (config: WorkspaceConfig | null) => void

  setAppRoute: (appId: string, appRoute: string) => void
}

export const useShellStore = create<ShellState>((set) => ({
  activeAppId: null,
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelContent: null,
  commandPaletteOpen: false,

  currentMember: null,
  activeWorkspaceId: null,
  workspaces: [],
  workspaceConfig: null,

  lastKnownAppRoute: {},

  hydrateBootstrap: (payload) =>
    set({
      currentMember: payload.member,
      activeAppId: payload.workspaceConfig.defaultApp,
      activeWorkspaceId: payload.activeWorkspaceId,
      workspaces: payload.workspaces,
      workspaceConfig: payload.workspaceConfig,
      rightPanelOpen: false,
      rightPanelContent: null,
      commandPaletteOpen: false,
      lastKnownAppRoute: {},
    }),

  clearSession: () =>
    set({
      currentMember: null,
      activeAppId: null,
      activeWorkspaceId: null,
      workspaces: [],
      workspaceConfig: null,
      rightPanelOpen: false,
      rightPanelContent: null,
      commandPaletteOpen: false,
      lastKnownAppRoute: {},
    }),

  setActiveApp: (id) => set({ activeAppId: id }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  toggleRightPanel: (content) =>
    set((s) => {
      if (!content) {
        return { rightPanelOpen: !s.rightPanelOpen }
      }
      const sameContentOpen = s.rightPanelOpen && s.rightPanelContent === content
      return {
        rightPanelOpen: !sameContentOpen,
        rightPanelContent: sameContentOpen ? s.rightPanelContent : content,
      }
    }),

  closeRightPanel: () => set({ rightPanelOpen: false }),

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setWorkspaceConfig: (config) => set({ workspaceConfig: config }),

  setAppRoute: (appId, appRoute) =>
    set((s) => ({ lastKnownAppRoute: { ...s.lastKnownAppRoute, [appId]: appRoute } })),
}))
