import type { ShellBootstrapReadyResult, ShellMember, WorkspaceConfig, WorkspaceMeta } from '@dashway/config-schema'
import { create } from 'zustand'

interface ShellState {
  activeAppId: string | null
  sidebarCollapsed: boolean
  rightPanelOpen: boolean
  rightPanelContent: 'details' | 'ai' | null
  commandPaletteOpen: boolean

  currentMember: ShellMember | null
  activeWorkspaceId: string | null
  workspaces: WorkspaceMeta[]
  workspaceConfig: WorkspaceConfig | null

  hydrateBootstrap: (payload: ShellBootstrapReadyResult) => void
  clearSession: () => void
  setActiveApp: (id: string | null) => void
  toggleSidebar: () => void
  toggleRightPanel: (content?: 'details' | 'ai') => void
  toggleCommandPalette: () => void

  setWorkspaces: (workspaces: WorkspaceMeta[]) => void
  setActiveWorkspace: (id: string | null) => void
  setWorkspaceConfig: (config: WorkspaceConfig | null) => void
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
    }),

  setActiveApp: (id) => set({ activeAppId: id }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  toggleRightPanel: (content) =>
    set((s) => ({
      rightPanelOpen: content ? true : !s.rightPanelOpen,
      rightPanelContent: content ?? s.rightPanelContent,
    })),

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setWorkspaceConfig: (config) => set({ workspaceConfig: config }),
}))
