import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import type { ChatMessage, ChatMember, RoomId } from '@/types/chat'
import { formatMessageTimestamp } from '@/shared/lib/date'
import { renderLexical } from '@/features/renderer/renderLexical'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { MessageAttachments } from './MessageAttachments'
import { MessageHoverToolbar } from './MessageHoverToolbar'

interface Props {
  message: ChatMessage
  author: ChatMember | undefined
  compact: boolean
  membersById?: Record<string, ChatMember>
  /** Room the message lives in. When provided, reply-in-thread + "N replies"
   *  navigate to `/c/:roomId/thread/:msgId`. Omitted in thread panel rendering
   *  (the parent + replies inside a thread don't start a second nested one). */
  roomId?: RoomId
}

/* eslint-disable no-console */
// Non-thread action stubs — wired in later milestones.
const stubReact = (id: string) => console.log('[react]', id)
const stubBookmark = (id: string) => console.log('[bookmark]', id)
const stubMore = (id: string) => console.log('[more]', id)
/* eslint-enable no-console */

export function MessageItem({ message, author, compact, membersById, roomId }: Props) {
  const navigate = useNavigate()
  const openThread = () => {
    if (roomId) navigate(`/c/${roomId}/thread/${message.id}`)
  }

  return (
    <article
      role="article"
      className={cn(
        'group relative flex gap-3 px-4 py-1 hover:bg-muted/40',
        compact ? 'pt-0.5' : 'pt-3',
      )}
      data-message-id={message.id}
      data-client-msg-id={message.clientMsgId}
    >
      <div className="w-9 shrink-0">
        {compact ? (
          <span className="mt-0.5 block text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
            {formatMessageTimestamp(message.serverCreatedAt)}
          </span>
        ) : (
          <Avatar className="h-9 w-9">
            {author?.avatarUrl ? <AvatarImage src={author.avatarUrl} alt={author.name} /> : null}
            <AvatarFallback className="text-xs">
              {(author?.name ?? 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {compact ? null : (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{author?.name ?? `Member #${message.authorId}`}</span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTimestamp(message.serverCreatedAt)}
            </span>
          </div>
        )}
        {message.plainText.trim().length > 0 ? (
          <div className="text-sm leading-relaxed" dir="auto">
            {renderLexical(message.content, { membersById })}
          </div>
        ) : null}
        {message.attachments && message.attachments.length > 0 ? (
          <MessageAttachments attachments={message.attachments} />
        ) : null}
        {roomId && message.replyCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-6 gap-1 px-2 text-xs text-primary"
            onClick={openThread}
          >
            <MessageSquare className="h-3 w-3" />
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </Button>
        ) : null}
      </div>
      <MessageHoverToolbar
        messageId={message.id}
        onReact={stubReact}
        onReplyInThread={roomId ? openThread : undefined}
        onBookmark={stubBookmark}
        onMore={stubMore}
      />
    </article>
  )
}
