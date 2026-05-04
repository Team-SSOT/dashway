import { AlertTriangle, ArrowDown, ArrowUp, Equal, Minus } from 'lucide-react'
import { type IssuePriority, PRIORITY_COLOR, PRIORITY_LABEL } from '@/features/issues/types'
import { cn } from '@/lib/utils'

const ICONS: Record<IssuePriority, typeof ArrowUp> = {
  NO_PRIORITY: Minus,
  LOW: ArrowDown,
  MEDIUM: Equal,
  HIGH: ArrowUp,
  URGENT: AlertTriangle,
}

export const PriorityIcon = ({
  priority,
  className,
}: {
  priority: IssuePriority
  className?: string
}) => {
  const Icon = ICONS[priority]
  return (
    <Icon
      aria-hidden
      className={cn('h-3.5 w-3.5 shrink-0', className)}
      style={{ color: PRIORITY_COLOR[priority] }}
    />
  )
}

export const PriorityBadge = ({
  priority,
  className,
}: {
  priority: IssuePriority
  className?: string
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-t1',
      className,
    )}
  >
    <PriorityIcon priority={priority} />
    {PRIORITY_LABEL[priority]}
  </span>
)
