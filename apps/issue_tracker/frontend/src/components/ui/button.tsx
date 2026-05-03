import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-accent-blue via-accent-violet to-accent-fuchsia text-white shadow-lg shadow-accent-blue/20 hover:brightness-110',
        outline:
          'border border-border-hi bg-transparent text-t1 hover:bg-surface-hi hover:border-border-hi',
        ghost: 'bg-transparent text-t2 hover:bg-surface hover:text-t1',
        subtle: 'bg-surface text-t1 border border-border hover:bg-surface-hi',
        destructive: 'bg-err/10 text-err border border-err/20 hover:bg-err/20',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-9 px-3.5',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
