import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="flex h-full min-h-0 bg-background">
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
