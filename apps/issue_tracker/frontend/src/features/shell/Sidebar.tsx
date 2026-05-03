import {
  Calendar,
  ChevronRight,
  GanttChart,
  Inbox,
  KanbanSquare,
  LayoutList,
  Plus,
  Settings,
  Star,
  Table2,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  count?: number
}

const PRIMARY: NavItem[] = [
  { to: '/inbox', label: 'Inbox', icon: <Inbox className="h-4 w-4" />, count: 3 },
  { to: '/board', label: 'Board', icon: <KanbanSquare className="h-4 w-4" /> },
  { to: '/table', label: 'Table', icon: <Table2 className="h-4 w-4" /> },
  { to: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  { to: '/gantt', label: 'Timeline', icon: <GanttChart className="h-4 w-4" /> },
]

const FAVORITES: NavItem[] = [
  { to: '/board', label: 'Landing v2 launch', icon: <Star className="h-4 w-4 text-warn" /> },
  { to: '/table', label: 'Context API roadmap', icon: <Star className="h-4 w-4 text-warn" /> },
]

export const Sidebar = () => {
  const [projectsOpen, setProjectsOpen] = useState(true)

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-bg-1/80 backdrop-blur">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-blue via-accent-violet to-accent-fuchsia text-xs font-bold text-white">
          D
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-t1">dashway</span>
          <span className="text-[10px] uppercase tracking-wider text-t3">
            issue tracker
          </span>
        </div>
      </div>

      <div className="p-3">
        <Button size="sm" className="w-full justify-center">
          <Plus className="h-3.5 w-3.5" />
          New issue
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 scrollbar-thin">
        <NavGroup title="Workspace">
          {PRIMARY.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </NavGroup>

        <NavGroup title="Favorites">
          {FAVORITES.map((item) => (
            <SidebarLink key={`fav-${item.label}`} item={item} />
          ))}
        </NavGroup>

        <button
          type="button"
          onClick={() => setProjectsOpen((v) => !v)}
          className="mt-4 flex w-full items-center gap-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-t3 hover:text-t2"
        >
          <ChevronRight
            className={cn('h-3 w-3 transition-transform', projectsOpen && 'rotate-90')}
          />
          Projects
        </button>
        {projectsOpen && (
          <div className="mb-3 flex flex-col gap-0.5">
            <ProjectRow color="#3b82f6" name="dashway core" count={18} />
            <ProjectRow color="#8b5cf6" name="Landing v2" count={6} />
            <ProjectRow color="#10b981" name="context-api" count={12} />
            <ProjectRow color="#f59e0b" name="Infra" count={4} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  )
}

const NavGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mb-3">
    <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-t3">
      {title}
    </div>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
)

const SidebarLink = ({ item }: { item: NavItem }) => (
  <NavLink
    to={item.to}
    end
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive ? 'bg-surface-hi text-t1' : 'text-t2 hover:bg-surface hover:text-t1',
      )
    }
  >
    {item.icon}
    <span className="flex-1 truncate">{item.label}</span>
    {typeof item.count === 'number' && (
      <span className="rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
        {item.count}
      </span>
    )}
  </NavLink>
)

const ProjectRow = ({ color, name, count }: { color: string; name: string; count: number }) => (
  <button
    type="button"
    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-t2 transition-colors hover:bg-surface hover:text-t1"
  >
    <LayoutList className="h-4 w-4" style={{ color }} />
    <span className="flex-1 truncate text-left">{name}</span>
    <span className="text-[11px] text-t3">{count}</span>
  </button>
)
