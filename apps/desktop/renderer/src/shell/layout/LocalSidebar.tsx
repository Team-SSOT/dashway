import { House, LayoutGrid, type LucideIcon, MessageCircle, SquareCheckBig } from '@dashway/ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'

const iconMap: Record<string, LucideIcon> = {
  house: House,
  'layout-grid': LayoutGrid,
  'message-circle': MessageCircle,
  'square-check-big': SquareCheckBig,
}

export function LocalSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeAppId, setActiveApp, workspaceConfig, workspaces, activeWorkspaceId } =
    useShellStore()

  const apps = workspaceConfig?.apps ?? []

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId)

  const handleNavClick = (appId: string) => {
    setActiveApp(appId)
    navigate(`/apps/${appId}`)
  }

  return (
    <aside className="local-sidebar no-select">
      <div className="sidebar-header">
        <span className="sidebar-header__title">{activeWorkspace?.name ?? 'Workspace'}</span>
      </div>

      <nav className="sidebar-nav">
        {apps.map((app) => {
          const isActive =
            activeAppId === app.id ||
            location.pathname.startsWith(`/apps/${app.id}`)

          const Icon = iconMap[app.icon]

          return (
            <button
              type="button"
              key={app.id}
              className="sidebar-nav__item"
              data-active={isActive}
              onClick={() => handleNavClick(app.id)}
            >
              <span className="sidebar-nav__icon">
                {Icon ? <Icon size={16} /> : app.title.charAt(0).toUpperCase()}
              </span>
              <span className="sidebar-nav__label">{app.title}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
