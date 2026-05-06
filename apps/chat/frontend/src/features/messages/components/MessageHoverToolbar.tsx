import type { ReactNode } from 'react'
import { MessageSquare, Bookmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import type { MessageId } from '@/types/chat'

interface Props {
  messageId: MessageId
  /** Slot for the reaction trigger (e.g. ReactionPicker). Rendered before icon actions. */
  reactionTrigger?: ReactNode
  /** Slot for the overflow ⋯ menu. Rendered after icon actions. Owns its own popover state. */
  moreMenuTrigger?: ReactNode
  /** When true, the toolbar stays visible regardless of hover state.
   *  Used while a child popover (reaction picker, more menu) is open so its anchor doesn't unmount. */
  forceVisible?: boolean
  onReplyInThread?: (messageId: MessageId) => void
  onBookmark?: (messageId: MessageId) => void
}

type HandlerKey = 'onReplyInThread' | 'onBookmark'

const ACTIONS: Array<{ key: HandlerKey; icon: LucideIcon; label: string }> = [
  { key: 'onReplyInThread', icon: MessageSquare, label: 'Reply in thread' },
  { key: 'onBookmark', icon: Bookmark, label: 'Bookmark' },
]

export function MessageHoverToolbar(props: Props) {
  return (
    <div
      className={cn(
        'absolute -top-4 right-3 gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-sm',
        props.forceVisible ? 'flex' : 'hidden group-hover:flex focus-within:flex',
      )}
      role="toolbar"
      aria-label="Message actions"
    >
      {props.reactionTrigger}
      {ACTIONS.map(({ key, icon: Icon, label }) => {
        const handler = props[key]
        if (!handler) return null
        return (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={label}
                onClick={() => handler(props.messageId)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        )
      })}
      {props.moreMenuTrigger}
    </div>
  )
}
