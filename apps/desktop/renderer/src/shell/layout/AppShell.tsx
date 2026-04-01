import { useShellStore } from '../model/shell-store'
import { ContentArea } from './ContentArea'
import { GlobalRail } from './GlobalRail'
import { LocalSidebar } from './LocalSidebar'
import { RightPanel } from './RightPanel'
import '../../shared/styles/shell.css'

export function AppShell() {
  const { sidebarCollapsed, rightPanelOpen } = useShellStore()

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
