import { Bell, Search } from '@dashway/ui/icons'
import { useShellStore } from '../model/shell-store'

const TRAFFIC_LIGHT_RESERVE_PX = 80

function detectPlatform(): 'darwin' | 'win32' | 'linux' {
  if (typeof navigator === 'undefined') return 'darwin'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'darwin'
  if (ua.includes('win')) return 'win32'
  return 'linux'
}

export function Topbar() {
  const { workspaces, activeWorkspaceId, currentMember, toggleCommandPalette } = useShellStore()
  const platform = detectPlatform()

  const reserveLeft = platform === 'darwin' ? TRAFFIC_LIGHT_RESERVE_PX : 0
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId)

  return (
    <header className="topbar drag-region">
      <div className="topbar__safe-area" style={{ width: reserveLeft }} />

      <div className="topbar__left no-drag">
        <button type="button" className="topbar__workspace">
          <span className="topbar__workspace-glyph">
            {activeWorkspace?.name?.charAt(0).toUpperCase() ?? 'W'}
          </span>
          <span className="topbar__workspace-name">{activeWorkspace?.name ?? 'Workspace'}</span>
          <span className="topbar__chev">▾</span>
        </button>
      </div>

      <div className="topbar__center no-drag">
        <button
          type="button"
          className="topbar__search"
          onClick={() => toggleCommandPalette()}
          aria-label="Open command palette"
        >
          <Search size={14} />
          <span className="topbar__search-label">Search</span>
          <span className="topbar__kbd">⌘K</span>
        </button>
      </div>

      <div className="topbar__right no-drag">
        <button type="button" className="topbar__icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button type="button" className="topbar__avatar" aria-label="Account">
          {currentMember?.name?.charAt(0).toUpperCase() ?? '?'}
        </button>
      </div>
    </header>
  )
}
