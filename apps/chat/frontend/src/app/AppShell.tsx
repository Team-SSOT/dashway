import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/features/shell/AppSidebar'
import { ShellRouteSync } from './ShellRouteSync'

export function AppShell() {
  return (
    <div className="flex h-full">
      <ShellRouteSync />
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
