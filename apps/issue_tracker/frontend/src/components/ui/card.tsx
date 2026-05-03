import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-b border-border', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />,
)
CardBody.displayName = 'CardBody'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4 border-t border-border flex items-center gap-2', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'
