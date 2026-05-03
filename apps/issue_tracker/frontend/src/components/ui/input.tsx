import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-t1 placeholder:text-t3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
