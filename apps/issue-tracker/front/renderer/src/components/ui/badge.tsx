import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface text-t1 border-border',
        outline: 'bg-transparent text-t2 border-border-hi',
        accent: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30',
        success: 'bg-ok/10 text-ok border-ok/30',
        warn: 'bg-warn/10 text-warn border-warn/30',
        danger: 'bg-err/10 text-err border-err/30',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
)
