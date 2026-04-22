import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface Props {
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Loading', className }: Props) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  )
}
