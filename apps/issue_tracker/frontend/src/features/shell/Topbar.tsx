import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const TITLE_BY_PATH: Record<string, string> = {
  '/inbox': 'Inbox',
  '/board': 'Board',
  '/table': 'All issues',
  '/calendar': 'Calendar',
  '/gantt': 'Timeline',
}

export const Topbar = () => {
  const { pathname } = useLocation()
  const isIssueDetail = pathname.startsWith('/issues/')
  const title = isIssueDetail ? 'Issue' : (TITLE_BY_PATH[pathname] ?? 'dashway')

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg-1/60 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-sm text-t3">dashway core</span>
        <span className="text-t3">/</span>
        <span className="text-sm font-medium text-t1">{title}</span>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <div className="flex items-center gap-1">
        <Badge variant="outline">10 issues</Badge>
        <Badge variant="accent">2 in progress</Badge>
      </div>

      <div className="flex-1" />

      <div className="relative w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t3" />
        <Input placeholder="Search issues, projects, people…" className="pl-7" />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-hi bg-bg-2 px-1.5 py-0.5 text-[10px] text-t3">
          ⌘K
        </kbd>
      </div>

      <Button variant="ghost" size="icon" aria-label="Filter">
        <Filter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Display options">
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </header>
  )
}
