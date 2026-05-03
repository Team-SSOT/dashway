import { Calendar } from 'lucide-react'
import { PriorityIcon } from '@/components/kibo-ui/priority'
import { StatusIcon } from '@/components/kibo-ui/status'
import { mockIssues } from '@/features/issues/mockData'
import type { Issue } from '@/features/issues/types'

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const buildMonthGrid = (): Date[] => {
  const today = new Date()
  const first = startOfMonth(today)
  const offset = first.getDay()
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

const issuesByDate = (issues: Issue[]): Map<string, Issue[]> => {
  const map = new Map<string, Issue[]>()
  for (const issue of issues) {
    if (!issue.dueAt) continue
    const key = new Date(issue.dueAt).toDateString()
    const list = map.get(key) ?? []
    list.push(issue)
    map.set(key, list)
  }
  return map
}

export const CalendarPage = () => {
  const grid = buildMonthGrid()
  const map = issuesByDate(mockIssues)
  const today = new Date().toDateString()
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-6 py-3">
        <Calendar className="h-4 w-4 text-t2" />
        <span className="text-sm font-semibold text-t1">{monthLabel}</span>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-bg-1/60 text-[11px] uppercase tracking-wide text-t3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-3 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-auto scrollbar-thin">
        {grid.map((d) => {
          const list = map.get(d.toDateString()) ?? []
          const isToday = d.toDateString() === today
          return (
            <div
              key={d.toISOString()}
              className="flex flex-col gap-1 border-b border-r border-border p-2 text-xs"
            >
              <span
                className={
                  isToday
                    ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-white'
                    : 'text-t3'
                }
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {list.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center gap-1 truncate rounded bg-surface px-1.5 py-0.5 text-[11px] text-t1"
                  >
                    <StatusIcon status={issue.status} className="h-2.5 w-2.5" />
                    <PriorityIcon priority={issue.priority} className="h-2.5 w-2.5" />
                    <span className="truncate">{issue.title}</span>
                  </div>
                ))}
                {list.length > 3 && (
                  <span className="text-[10px] text-t3">+{list.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
