import { CheckCircle2, Circle, CircleDashed, CircleDot, CircleSlash, Loader2 } from 'lucide-react'
import { type IssueStatus, STATUS_COLOR, STATUS_LABEL } from '@/features/issues/types'
import { cn } from '@/lib/utils'

const ICONS: Record<IssueStatus, typeof Circle> = {
  BACKLOG: CircleDashed,
  TODO: Circle,
  IN_PROGRESS: Loader2,
  IN_REVIEW: CircleDot,
  DONE: CheckCircle2,
  CANCELLED: CircleSlash,
}

export const StatusIcon = ({ status, className }: { status: IssueStatus; className?: string }) => {
  const Icon = ICONS[status]
  return (
    <Icon
      aria-hidden
      className={cn('h-3.5 w-3.5 shrink-0', className)}
      style={{ color: STATUS_COLOR[status] }}
    />
  )
}

export const StatusBadge = ({ status, className }: { status: IssueStatus; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-t1',
      className,
    )}
  >
    <StatusIcon status={status} />
    {STATUS_LABEL[status]}
  </span>
)
