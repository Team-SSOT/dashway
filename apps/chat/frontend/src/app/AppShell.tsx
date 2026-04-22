import { Outlet } from 'react-router-dom'
import { GlobalRail } from '@/features/rooms/components/GlobalRail'
import { ChannelSidebar } from '@/features/rooms/components/ChannelSidebar'

export function AppShell() {
  return (
    <div className="flex h-full min-h-0">
      <aside className="min-w-14 w-14 shrink-0 border-r border-border bg-card">
        <GlobalRail />
      </aside>
      <aside className="min-w-60 w-60 shrink-0 border-r border-border bg-card">
        <ChannelSidebar />
      </aside>
      <main className="flex-1 min-w-[480px] min-h-0">
        <Outlet />
      </main>
    </div>
  )
}
