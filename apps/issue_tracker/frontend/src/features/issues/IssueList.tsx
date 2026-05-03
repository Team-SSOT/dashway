import { useNavigate } from 'react-router-dom'
import { AvatarStack } from '@/components/kibo-ui/avatar-stack'
import { PriorityIcon } from '@/components/kibo-ui/priority'
import { StatusIcon } from '@/components/kibo-ui/status'
import { TagList } from '@/components/kibo-ui/tags'
import { mockIssues } from './mockData'
import type { Issue } from './types'

const formatDate = (iso?: string) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const IssueList = () => {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <ul className="divide-y divide-border">
        {mockIssues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} onOpen={() => navigate(`/issues/${issue.id}`)} />
        ))}
      </ul>
    </div>
  )
}

const IssueRow = ({ issue, onOpen }: { issue: Issue; onOpen: () => void }) => (
  <li style={{ contentVisibility: 'auto' }}>
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
    >
      <PriorityIcon priority={issue.priority} />
      <StatusIcon status={issue.status} />
      <span className="w-16 font-mono text-[12px] text-t3">{issue.key}</span>
      <span className="flex-1 truncate text-sm text-t1">{issue.title}</span>
      <TagList labels={issue.labels} max={2} />
      {formatDate(issue.dueAt) && (
        <span className="w-16 text-right text-[12px] text-t3">{formatDate(issue.dueAt)}</span>
      )}
      <AvatarStack users={issue.assignees} size="sm" />
    </button>
  </li>
)
