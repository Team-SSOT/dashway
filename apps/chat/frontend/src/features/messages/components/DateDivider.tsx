import { formatDateDivider } from '@/shared/lib/date'

export function DateDivider({ iso }: { iso: string }) {
  const label = formatDateDivider(iso)

  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-border" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  )
}
