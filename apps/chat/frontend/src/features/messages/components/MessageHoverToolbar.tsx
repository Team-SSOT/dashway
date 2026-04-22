import { Smile, MessageSquare, Bookmark, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import type { MessageId } from '@/types/chat'

interface Props {
  messageId: MessageId
  onReact?: (messageId: MessageId) => void
  onReplyInThread?: (messageId: MessageId) => void
  onBookmark?: (messageId: MessageId) => void
  onMore?: (messageId: MessageId) => void
}

type HandlerKey = 'onReact' | 'onReplyInThread' | 'onBookmark' | 'onMore'

const ACTIONS: Array<{ key: HandlerKey; icon: LucideIcon; label: string }> = [
  { key: 'onReact', icon: Smile, label: 'Add reaction' },
  { key: 'onReplyInThread', icon: MessageSquare, label: 'Reply in thread' },
  { key: 'onBookmark', icon: Bookmark, label: 'Bookmark' },
  { key: 'onMore', icon: MoreHorizontal, label: 'More' },
]

export function MessageHoverToolbar(props: Props) {
  return (
    <div
      className="absolute -top-4 right-3 hidden gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-sm group-hover:flex focus-within:flex"
      role="toolbar"
      aria-label="Message actions"
    >
      {ACTIONS.map(({ key, icon: Icon, label }) => {
        const handler = props[key]
        return (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={label}
                onClick={() => handler?.(props.messageId)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
