import { useState } from 'react'
import { MoreHorizontal, Link as LinkIcon, Type, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import type { ChatMessage } from '@/types/chat'

interface Props {
  message: ChatMessage
  canDelete: boolean
  onDelete: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function buildMessageLink(message: Pick<ChatMessage, 'id' | 'roomId' | 'threadParentId'>, origin: string): string {
  if (message.threadParentId) {
    return `${origin}/c/${message.roomId}/thread/${message.threadParentId}`
  }
  return `${origin}/c/${message.roomId}?m=${message.id}`
}

async function copy(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  await navigator.clipboard.writeText(text)
}

export function MoreMenu({ message, canDelete, onDelete, open, onOpenChange }: Props) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-44">
        <DropdownMenuItem
          onSelect={() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            void copy(buildMessageLink(message, origin))
          }}
        >
          <LinkIcon />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy(message.plainText)}>
          <Type />
          Copy text
        </DropdownMenuItem>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete()}
            >
              <Trash2 />
              Delete message
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ContainerProps {
  message: ChatMessage
  canDelete: boolean
  onDelete: () => void
}

/** Convenience wrapper that owns its own open state — for callers that don't need to coordinate. */
export function MoreMenuStandalone(props: ContainerProps) {
  const [open, setOpen] = useState(false)
  return <MoreMenu {...props} open={open} onOpenChange={setOpen} />
}
