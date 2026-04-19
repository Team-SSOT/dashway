import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export const AppShell = ({ children }: { children: ReactNode }) => (
  <TooltipProvider delayDuration={150}>
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-t1">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  </TooltipProvider>
)
