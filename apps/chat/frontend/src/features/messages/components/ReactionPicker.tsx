import { useState } from 'react'
import { Smile } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

export const REACTION_PRESET = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const

interface Props {
  onPick: (emoji: string) => void
  triggerClassName?: string
  /** Controlled open state. When omitted, picker manages its own state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ReactionPicker({ onPick, triggerClassName, open: openProp, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setInternalOpen(v)
    onOpenChange?.(v)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName ?? 'h-7 w-7'}
          aria-label="Add reaction"
        >
          <Smile className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-auto p-1"
        role="menu"
        aria-label="Reaction picker"
      >
        <div className="flex gap-0.5">
          {REACTION_PRESET.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-lg"
              onClick={() => {
                onPick(emoji)
                setOpen(false)
              }}
              aria-label={`React with ${emoji}`}
            >
              <span>{emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
