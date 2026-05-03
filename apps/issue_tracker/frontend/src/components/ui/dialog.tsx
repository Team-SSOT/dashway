import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

export const DialogContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border-hi bg-bg-1 shadow-2xl outline-none',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-t2 transition-opacity hover:text-t1 focus:outline-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-t1', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-t2', className)} {...props} />
))
DialogDescription.displayName = 'DialogDescription'
