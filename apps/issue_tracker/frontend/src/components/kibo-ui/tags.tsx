import type { Label } from '@/features/issues/types'
import { cn } from '@/lib/utils'

export const Tag = ({ label, className }: { label: Label; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
      className,
    )}
    style={{
      borderColor: `${label.color}40`,
      backgroundColor: `${label.color}1a`,
      color: label.color,
    }}
  >
    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
    {label.name}
  </span>
)

export const TagList = ({ labels, max = 3 }: { labels: Label[]; max?: number }) => {
  if (labels.length === 0) return null
  const visible = labels.slice(0, max)
  const overflow = labels.length - visible.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((label) => (
        <Tag key={label.id} label={label} />
      ))}
      {overflow > 0 && (
        <span className="rounded-full border border-border px-1.5 py-0.5 text-[11px] text-t2">
          +{overflow}
        </span>
      )}
    </div>
  )
}
