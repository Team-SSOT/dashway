import { PriorityIcon } from '@/components/kibo-ui/priority'
import { mockIssues } from '@/features/issues/mockData'

const TODAY = new Date()
const DAYS = 28
const start = new Date(TODAY)
start.setDate(TODAY.getDate() - 7)

const dayIndex = (iso: string): number => {
  const diff = (new Date(iso).getTime() - start.getTime()) / 86_400_000
  return Math.round(diff)
}

export const GanttPage = () => (
  <div className="flex h-full flex-col">
    <div className="border-b border-border px-6 py-3 text-sm font-semibold text-t1">
      Timeline · next {DAYS} days
    </div>
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `220px repeat(${DAYS}, 32px)` }}
      >
        <div className="border-r border-border bg-bg-1/60 px-3 py-2 text-[11px] uppercase text-t3">
          Issue
        </div>
        {Array.from({ length: DAYS }, (_, i) => {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          return (
            <div
              key={d.toISOString()}
              className="border-r border-border bg-bg-1/40 px-1 py-2 text-center text-[10px] text-t3"
            >
              {d.getDate()}
            </div>
          )
        })}
      </div>
      {mockIssues
        .filter((i) => i.dueAt)
        .map((issue) => {
          const due = dayIndex(issue.dueAt!)
          const created = Math.max(0, dayIndex(issue.createdAt))
          const span = Math.max(1, due - created + 1)
          return (
            <div
              key={issue.id}
              className="grid items-center border-b border-border"
              style={{ gridTemplateColumns: `220px repeat(${DAYS}, 32px)` }}
            >
              <div className="flex items-center gap-2 border-r border-border px-3 py-2 text-sm text-t1">
                <PriorityIcon priority={issue.priority} />
                <span className="truncate">{issue.title}</span>
              </div>
              <div
                className="m-1 h-5 rounded-sm bg-gradient-to-r from-accent-blue/70 to-accent-violet/70"
                style={{
                  gridColumn: `${created + 2} / span ${span}`,
                }}
              />
            </div>
          )
        })}
    </div>
  </div>
)
