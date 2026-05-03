import type { DashwayAppManifest, PatchOp, SidebarSpec } from '@dashway/app-protocol'
import type {
  ShellBootstrapReadyResult,
  ShellMember,
  WorkspaceConfig,
  WorkspaceMeta,
} from '@dashway/config-schema'
import { create } from 'zustand'

export type ManifestEntry =
  | { status: 'pending' }
  | { status: 'ok'; manifest: DashwayAppManifest }
  | { status: 'error'; error: string }

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

  manifests: Record<string, ManifestEntry>
  sidebarSpecs: Record<string, SidebarSpec>
  lastKnownAppRoute: Record<string, string>
  collapsedSections: Record<string, boolean>

  hydrateBootstrap: (payload: ShellBootstrapReadyResult) => void
  clearSession: () => void
  setActiveApp: (id: string | null) => void
  toggleSidebar: () => void
  toggleRightPanel: (content?: 'details' | 'ai') => void
  toggleCommandPalette: () => void

  setWorkspaces: (workspaces: WorkspaceMeta[]) => void
  setActiveWorkspace: (id: string | null) => void
  setWorkspaceConfig: (config: WorkspaceConfig | null) => void

  setManifest: (appId: string, entry: ManifestEntry) => void
  setSidebarSpec: (appId: string, spec: SidebarSpec) => void
  applySidebarPatch: (appId: string, ops: PatchOp[]) => void
  setAppRoute: (appId: string, appRoute: string) => void
  toggleSection: (sectionKey: string) => void
}

function applyPatchOps(spec: SidebarSpec | undefined, ops: PatchOp[]): SidebarSpec | undefined {
  if (!spec) return spec
  let nextGroups = spec.groups

  for (const op of ops) {
    if (op.op === 'set-badge') {
      nextGroups = nextGroups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.id === op.itemId ? { ...item, badge: op.badge ?? undefined } : item,
        ),
      }))
    } else if (op.op === 'replace-group') {
      nextGroups = nextGroups.map((group) =>
        group.id === op.groupId ? { ...group, items: op.items } : group,
      )
    }
  }

  return { ...spec, groups: nextGroups }
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

  manifests: {},
  sidebarSpecs: {},
  lastKnownAppRoute: {},
  collapsedSections: {},

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
      manifests: {},
      sidebarSpecs: {},
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
      manifests: {},
      sidebarSpecs: {},
      lastKnownAppRoute: {},
      collapsedSections: {},
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

  setManifest: (appId, entry) =>
    set((s) => {
      const next: Record<string, ManifestEntry> = { ...s.manifests, [appId]: entry }
      const sidebarSpecs =
        entry.status === 'ok'
          ? { ...s.sidebarSpecs, [appId]: entry.manifest.sidebar }
          : s.sidebarSpecs
      return { manifests: next, sidebarSpecs }
    }),

  setSidebarSpec: (appId, spec) =>
    set((s) => ({ sidebarSpecs: { ...s.sidebarSpecs, [appId]: spec } })),

  applySidebarPatch: (appId, ops) =>
    set((s) => {
      const current = s.sidebarSpecs[appId]
      const next = applyPatchOps(current, ops)
      if (!next) return s
      return { sidebarSpecs: { ...s.sidebarSpecs, [appId]: next } }
    }),

  setAppRoute: (appId, appRoute) =>
    set((s) => ({ lastKnownAppRoute: { ...s.lastKnownAppRoute, [appId]: appRoute } })),

  toggleSection: (sectionKey) =>
    set((s) => ({
      collapsedSections: {
        ...s.collapsedSections,
        [sectionKey]: !s.collapsedSections[sectionKey],
      },
    })),
}))
