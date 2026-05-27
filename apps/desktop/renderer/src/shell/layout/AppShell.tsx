import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'
import { AppRail } from './AppRail'
import { CommandPalette } from './CommandPalette'
import { ContentArea } from './ContentArea'
import { RightPanel } from './RightPanel'
import { Topbar } from './Topbar'
import '../../shared/styles/shell.css'

export function AppShell() {
  const location = useLocation()
  const {
    sidebarCollapsed,
    rightPanelOpen,
    activeAppId,
    activeWorkspaceId,
    workspaceConfig,
    currentMember,
    toggleCommandPalette,
  } = useShellStore()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        toggleCommandPalette()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleCommandPalette])

  useEffect(() => {
    console.info('[dashway:shell] app shell rendered', {
      pathname: location.pathname,
      activeAppId,
      activeWorkspaceId,
      currentMember: currentMember?.email ?? null,
      enabledApps: workspaceConfig?.enabledApps ?? [],
      remoteApps:
        workspaceConfig?.apps.map((app) => ({
          id: app.id,
          title: app.title,
          entryUrl: app.entryUrl,
        })) ?? [],
      defaultApp: workspaceConfig?.defaultApp ?? null,
    })
  }, [activeAppId, activeWorkspaceId, currentMember?.email, location.pathname, workspaceConfig])

  return (
    <div
      className="shell"
      data-sidebar-collapsed={sidebarCollapsed}
      data-right-panel-open={rightPanelOpen}
    >
      <Topbar />
      <AppRail />
      <ContentArea />
      {rightPanelOpen && <RightPanel />}
      <CommandPalette />
    </div>
  )
}
