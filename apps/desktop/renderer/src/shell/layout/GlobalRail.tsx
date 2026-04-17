import { House, LayoutGrid, type LucideIcon, MessageCircle, SquareCheckBig } from '@dashway/ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'

const iconMap: Record<string, LucideIcon> = {
  house: House,
  'layout-grid': LayoutGrid,
  'message-circle': MessageCircle,
  'square-check-big': SquareCheckBig,
}

export function GlobalRail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeAppId, setActiveApp, workspaceConfig } = useShellStore()

  const apps = workspaceConfig?.apps ?? []

  const handleAppClick = (appId: string) => {
    setActiveApp(appId)
    navigate(`/apps/${appId}`)
  }

  return (
    <nav className="global-rail no-select">
      <div className="drag-region" style={{ height: 20, width: '100%' }} />
      {apps.map((app) => {
        const isActive =
          activeAppId === app.id || location.pathname.startsWith(`/apps/${app.id}`)
        const Icon = iconMap[app.icon]

        return (
          <button
            type="button"
            key={app.id}
            className="global-rail__item no-drag"
            data-active={isActive}
            title={app.title}
            onClick={() => handleAppClick(app.id)}
          >
            {Icon ? <Icon size={18} /> : app.title.charAt(0).toUpperCase()}
          </button>
        )
      })}
    </nav>
  )
}
