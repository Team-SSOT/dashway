import type { WorkspaceApp } from '@dashway/config-schema'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'
import { resolveIcon } from './icon-resolver'

interface AppRailItemProps {
  app: WorkspaceApp
  active: boolean
}

function AppRailItem({ app, active }: AppRailItemProps) {
  const navigate = useNavigate()
  const setActiveApp = useShellStore((s) => s.setActiveApp)
  const Icon = resolveIcon(app.icon)
  const initial = app.title.charAt(0).toUpperCase()

  const handleClick = () => {
    setActiveApp(app.id)
    navigate(`/apps/${app.id}`)
  }

  return (
    <button
      type="button"
      className="app-rail__item"
      data-active={active}
      onClick={handleClick}
      title={app.title}
      aria-label={app.title}
    >
      <span className="app-rail__icon">{Icon ? <Icon size={18} /> : initial}</span>
    </button>
  )
}

export function AppRail() {
  const location = useLocation()
  const workspaceConfig = useShellStore((s) => s.workspaceConfig)
  const activeAppId = useShellStore((s) => s.activeAppId)

  const apps = workspaceConfig?.apps ?? []
  const navOrder = workspaceConfig?.navOrder ?? apps.map((a) => a.id)
  const ordered = navOrder
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is WorkspaceApp => a !== undefined)

  return (
    <nav className="app-rail no-select" aria-label="Apps">
      {ordered.length === 0 ? (
        <div className="app-rail__empty">·</div>
      ) : (
        ordered.map((app) => {
          const onPath = location.pathname.startsWith(`/apps/${app.id}`)
          const active = onPath || (activeAppId === app.id && location.pathname === '/')
          return <AppRailItem key={app.id} app={app} active={active} />
        })
      )}
    </nav>
  )
}
