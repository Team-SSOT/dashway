import { Calendar } from 'lucide-react'
import { AvatarStack } from '@/components/kibo-ui/avatar-stack'
import { PriorityIcon } from '@/components/kibo-ui/priority'
import { TagList } from '@/components/kibo-ui/tags'
import type { Issue } from './types'

const formatDue = (iso?: string) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const IssueCard = ({ issue }: { issue: Issue }) => {
  const due = formatDue(issue.dueAt)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[11px] text-t3">
        <PriorityIcon priority={issue.priority} />
        <span className="font-mono">{issue.key}</span>
      </div>
      <div className="text-sm font-medium leading-snug text-t1">{issue.title}</div>
      {issue.labels.length > 0 && <TagList labels={issue.labels} />}
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-t3">
          {due && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {due}
            </span>
          )}
        </div>
        <AvatarStack users={issue.assignees} size="sm" />
      </div>
    </div>
  )
}
