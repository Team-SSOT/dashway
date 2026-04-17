import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'
import { ContentArea } from './ContentArea'
import { GlobalRail } from './GlobalRail'
import { LocalSidebar } from './LocalSidebar'
import { RightPanel } from './RightPanel'
import '../../shared/styles/shell.css'

export function AppShell() {
  const location = useLocation()
  const { sidebarCollapsed, rightPanelOpen, activeAppId, activeWorkspaceId, workspaceConfig, currentMember } =
    useShellStore()

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
      <GlobalRail />
      {!sidebarCollapsed && <LocalSidebar />}
      <ContentArea />
      {rightPanelOpen && <RightPanel />}
    </div>
  )
}
