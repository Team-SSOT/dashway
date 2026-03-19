import type { WorkspaceConfig, WorkspaceMeta } from '@dashway/config-schema'
import { create } from 'zustand'

interface ShellState {
  activeAppId: string | null
  sidebarCollapsed: boolean
  rightPanelOpen: boolean
  rightPanelContent: 'details' | 'ai' | null
  commandPaletteOpen: boolean

  activeWorkspaceId: string | null
  workspaces: WorkspaceMeta[]
  workspaceConfig: WorkspaceConfig | null

  setActiveApp: (id: string) => void
  toggleSidebar: () => void
  toggleRightPanel: (content?: 'details' | 'ai') => void
  toggleCommandPalette: () => void

  setWorkspaces: (workspaces: WorkspaceMeta[]) => void
  setActiveWorkspace: (id: string) => void
  setWorkspaceConfig: (config: WorkspaceConfig) => void
}

export const useShellStore = create<ShellState>((set) => ({
  activeAppId: null,
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelContent: null,
  commandPaletteOpen: false,

  activeWorkspaceId: null,
  workspaces: [],
  workspaceConfig: null,

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
