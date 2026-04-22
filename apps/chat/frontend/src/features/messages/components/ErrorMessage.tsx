import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'

interface Props {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: Props) {
  return (
    <div
      className={cn('flex flex-col items-center gap-2 p-6 text-center', className)}
      role="alert"
    >
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
