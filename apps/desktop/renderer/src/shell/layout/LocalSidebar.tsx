import { House, type LucideIcon, MessageCircle, SquareCheckBig } from '@dashway/ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'
import { appRegistry } from '../registry/app-registry'

const iconMap: Record<string, LucideIcon> = {
  house: House,
  'message-circle': MessageCircle,
  'square-check-big': SquareCheckBig,
}

export function LocalSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeAppId, setActiveApp, workspaceConfig, workspaces, activeWorkspaceId } =
    useShellStore()

  const manifests = appRegistry.getOrderedManifests(workspaceConfig?.navOrder ?? [])
  const activeApp = activeAppId ? appRegistry.get(activeAppId) : null
  const SidebarContent = activeApp?.sidebar

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId)

  const handleNavClick = (appId: string) => {
    const app = appRegistry.get(appId)
    if (!app) return
    setActiveApp(appId)
    navigate(app.manifest.routes[0] ?? `/${appId}`)
  }

  return (
    <aside className="local-sidebar no-select">
      <div className="sidebar-header">
        <span className="sidebar-header__title">{activeWorkspace?.name ?? 'Workspace'}</span>
      </div>

      <nav className="sidebar-nav">
        {manifests.map((manifest) => {
          const isActive =
            activeAppId === manifest.id ||
            manifest.routes.some((r) => location.pathname.startsWith(r))

          const Icon = iconMap[manifest.icon]

          return (
            <button
              type="button"
              key={manifest.id}
              className="sidebar-nav__item"
              data-active={isActive}
              onClick={() => handleNavClick(manifest.id)}
            >
              <span className="sidebar-nav__icon">{Icon ? <Icon size={16} /> : manifest.icon}</span>
              <span className="sidebar-nav__label">{manifest.title}</span>
            </button>
          )
        })}
      </nav>

      {SidebarContent && (
        <div className="sidebar-app-content">
          <SidebarContent />
        </div>
      )}
    </aside>
  )
}
