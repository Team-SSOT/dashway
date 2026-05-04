import type { SidebarBadge, SidebarItem } from '@dashway/app-protocol'
import type { WorkspaceApp } from '@dashway/config-schema'
import { ChevronDown, ChevronRight, type LucideIcon } from '@dashway/ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useManifestLoader } from '../hooks/use-manifests'
import { useShellStore } from '../model/shell-store'
import { resolveIcon } from './icon-resolver'

function joinAppRoute(appId: string, appRoute: string): string {
  const trimmed = appRoute.replace(/^\/+/, '')
  return trimmed.length === 0 ? `/apps/${appId}` : `/apps/${appId}/${trimmed}`
}

function normalizeRoute(route: string | undefined): string {
  if (!route || route === '') return '/'
  return route.startsWith('/') ? route : `/${route}`
}

function isItemActive(args: {
  pathname: string
  activeAppId: string | null
  appId: string
  itemRoute: string
  lastKnownAppRoute: string | undefined
}): boolean {
  const { pathname, activeAppId, appId, itemRoute, lastKnownAppRoute } = args
  const target = joinAppRoute(appId, itemRoute)

  // URL 정확 매치 우선 (사이드바 클릭으로 URL이 갱신된 경우)
  if (pathname === target) return true
  if (itemRoute === '/' && pathname === `/apps/${appId}`) return true

  // iframe 내부 라우팅으로 인해 URL은 안 바뀌고 store만 갱신된 경우
  if (activeAppId === appId && normalizeRoute(lastKnownAppRoute) === normalizeRoute(itemRoute)) {
    return true
  }

  return false
}

function Badge({ badge }: { badge: SidebarBadge }) {
  if (badge.kind === 'dot') {
    return <span className={`sidebar-item__dot tone-${badge.tone ?? 'neutral'}`} />
  }
  return (
    <span className={`sidebar-item__count tone-${badge.tone ?? 'neutral'}`}>{badge.value}</span>
  )
}

interface SidebarItemRowProps {
  appId: string
  item: SidebarItem
}

function SidebarItemRow({ appId, item }: SidebarItemRowProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const setActiveApp = useShellStore((s) => s.setActiveApp)
  const activeAppId = useShellStore((s) => s.activeAppId)
  const lastKnownAppRoute = useShellStore((s) => s.lastKnownAppRoute[appId])
  const Icon = resolveIcon(item.icon)
  const active = isItemActive({
    pathname: location.pathname,
    activeAppId,
    appId,
    itemRoute: item.appRoute,
    lastKnownAppRoute,
  })

  const handleClick = () => {
    setActiveApp(appId)
    navigate(joinAppRoute(appId, item.appRoute))
  }

  return (
    <button
      type="button"
      className="sidebar-item"
      data-active={active}
      onClick={handleClick}
      title={item.label}
    >
      <span className="sidebar-item__icon">{Icon ? <Icon size={14} /> : null}</span>
      <span className="sidebar-item__label">{item.label}</span>
      {item.badge ? <Badge badge={item.badge} /> : null}
    </button>
  )
}

interface AppSectionProps {
  app: WorkspaceApp
}

function AppSection({ app }: AppSectionProps) {
  const sidebarSpec = useShellStore((s) => s.sidebarSpecs[app.id])
  const manifestEntry = useShellStore((s) => s.manifests[app.id])
  const collapsed = useShellStore((s) => s.collapsedSections[app.id] ?? false)
  const toggleSection = useShellStore((s) => s.toggleSection)
  const AppIcon: LucideIcon | null = resolveIcon(app.icon)

  const isError = manifestEntry?.status === 'error'
  const isPending = !sidebarSpec && !isError

  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section__header"
        onClick={() => toggleSection(app.id)}
        aria-expanded={!collapsed}
      >
        <span className="sidebar-section__chevron">
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </span>
        <span className="sidebar-section__icon">
          {AppIcon ? <AppIcon size={12} /> : app.title.charAt(0)}
        </span>
        <span className="sidebar-section__title">{app.title}</span>
      </button>

      {!collapsed && (
        <div className="sidebar-section__body">
          {isError && (
            <div className="sidebar-section__error" title={manifestEntry.error}>
              Manifest unavailable
            </div>
          )}
          {isPending && (
            <div className="sidebar-section__skeleton">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          )}
          {sidebarSpec?.groups.map((group) => (
            <div key={group.id} className="sidebar-group">
              {group.title && <div className="sidebar-group__title">{group.title}</div>}
              {group.items.map((item) => (
                <SidebarItemRow key={item.id} appId={app.id} item={item} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function UnifiedSidebar() {
  const workspaceConfig = useShellStore((s) => s.workspaceConfig)
  const apps = workspaceConfig?.apps ?? []
  const navOrder = workspaceConfig?.navOrder ?? apps.map((a) => a.id)
  const ordered = navOrder
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is WorkspaceApp => a !== undefined)

  useManifestLoader(ordered)

  return (
    <aside className="unified-sidebar no-select">
      {ordered.length === 0 ? (
        <div className="unified-sidebar__empty">No apps enabled</div>
      ) : (
        ordered.map((app) => <AppSection key={app.id} app={app} />)
      )}
    </aside>
  )
}
