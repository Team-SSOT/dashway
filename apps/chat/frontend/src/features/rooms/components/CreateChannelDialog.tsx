import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { useCreateChannel } from '../hooks/useCreateChannel'
import { validateChannelName } from '../model/validateChannelName'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: string[]
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  existingNames,
}: CreateChannelDialogProps) {
  const navigate = useNavigate()
  const createChannel = useCreateChannel()

  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  function resetForm() {
    if (inputRef.current) inputRef.current.value = ''
    setError(null)
    setTouched(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  function handleBlur() {
    setTouched(true)
    const raw = inputRef.current?.value ?? ''
    const v = validateChannelName(raw, existingNames)
    if (!v.ok) setError(v.message)
    else setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const raw = inputRef.current?.value ?? ''
    const v = validateChannelName(raw, existingNames)
    if (!v.ok) {
      setError(v.message)
      return
    }
    setError(null)
    try {
      const room = await createChannel.mutateAsync({ name: raw })
      navigate(`/chat/${room.id}`)
      handleOpenChange(false)
    } catch (err) {
      const chatErr = err as { message?: string }
      setError(chatErr?.message ?? 'Failed to create channel')
    }
  }

  // Live validation for submit-button disabled state (no error display before touch)
  const currentValue = inputRef.current?.value ?? ''
  const liveValidation = validateChannelName(currentValue, existingNames)
  const canSubmit = !createChannel.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Channels are for topic-based conversations. Names use lowercase letters, numbers,
            hyphens, and underscores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. design-review"
              autoFocus
              autoComplete="off"
              disabled={createChannel.isPending}
              onBlur={handleBlur}
              onChange={() => {
                if (touched) {
                  const raw = inputRef.current?.value ?? ''
                  const v = validateChannelName(raw, existingNames)
                  if (!v.ok) setError(v.message)
                  else setError(null)
                }
              }}
              aria-invalid={touched && error != null ? true : undefined}
              aria-describedby={error ? 'channel-name-error' : undefined}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                touched && error && 'border-destructive focus:ring-destructive/50',
              )}
            />
            {touched && error ? (
              <p id="channel-name-error" className="text-xs text-destructive">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground invisible" aria-hidden>
                &nbsp;
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={createChannel.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || (touched && !liveValidation.ok)}
            >
              {createChannel.isPending ? 'Creating…' : 'Create channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
