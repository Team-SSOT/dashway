import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import type { ChatMessage, ChatMember, RoomId } from '@/types/chat'
import { currentUserId } from '@/data/mockData'
import { formatMessageTimestamp } from '@/shared/lib/date'
import { renderLexical } from '@/features/renderer/renderLexical'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { canDeleteMessage } from '@/features/rooms/permissions'
import { useRoomMemberships } from '@/features/rooms/hooks/useRoomMemberships'
import { useToggleReaction } from '../hooks/useToggleReaction'
import { useDeleteMessage } from '../hooks/useDeleteMessage'
import { MessageAttachments } from './MessageAttachments'
import { MessageHoverToolbar } from './MessageHoverToolbar'
import { MoreMenu } from './MoreMenu'
import { ReactionChips } from './ReactionChips'
import { ReactionPicker } from './ReactionPicker'

interface Props {
  message: ChatMessage
  author: ChatMember | undefined
  compact: boolean
  membersById?: Record<string, ChatMember>
  /** Room the message lives in. When provided, reply-in-thread + "N replies"
   *  navigate to `/chat/:roomId/thread/:msgId`. Omitted in thread panel rendering
   *  (the parent + replies inside a thread don't start a second nested one). */
  roomId?: RoomId
}

/* eslint-disable no-console */
const stubBookmark = (id: string) => console.log('[bookmark]', id)
/* eslint-enable no-console */

export function MessageItem({ message, author, compact, membersById, roomId }: Props) {
  const navigate = useNavigate()
  const openThread = () => {
    if (roomId) navigate(`/chat/${roomId}/thread/${message.id}`)
  }

  const toggle = useToggleReaction(message.roomId)
  const deleteMutation = useDeleteMessage(message.roomId)
  const { data: memberships } = useRoomMemberships(message.roomId)
  const myMembership = memberships?.find((m) => m.memberId === currentUserId)
  const canDelete = canDeleteMessage({
    role: myMembership?.role,
    authorId: message.authorId,
    currentUserId,
  })
  const isDeleted = message.deletedAt !== null

  const [pickerOpen, setPickerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const reactedByMeFor = (emoji: string): boolean =>
    message.reactions?.find((r) => r.emoji === emoji)?.userIds.includes(currentUserId) ?? false
  const handleToggleReaction = (emoji: string, hasMine: boolean) => {
    toggle.mutate({ messageId: message.id, emoji, hasMine })
  }
  const handlePickReaction = (emoji: string) => {
    handleToggleReaction(emoji, reactedByMeFor(emoji))
  }
  const handleDelete = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Delete this message?')
      if (!ok) return
    }
    deleteMutation.mutate({ messageId: message.id })
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
        {isDeleted ? (
          <div className="text-sm italic text-muted-foreground" dir="auto">
            This message was deleted.
          </div>
        ) : (
          <>
            {message.plainText.trim().length > 0 ? (
              <div className="text-sm leading-relaxed" dir="auto">
                {renderLexical(message.content, { membersById })}
              </div>
            ) : null}
            {message.attachments && message.attachments.length > 0 ? (
              <MessageAttachments attachments={message.attachments} />
            ) : null}
            <ReactionChips reactions={message.reactions} onToggle={handleToggleReaction} />
          </>
        )}
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
      {isDeleted ? null : (
        <MessageHoverToolbar
          messageId={message.id}
          forceVisible={pickerOpen || moreOpen}
          reactionTrigger={
            <ReactionPicker
              onPick={handlePickReaction}
              open={pickerOpen}
              onOpenChange={setPickerOpen}
            />
          }
          moreMenuTrigger={
            <MoreMenu
              message={message}
              canDelete={canDelete}
              onDelete={handleDelete}
              open={moreOpen}
              onOpenChange={setMoreOpen}
            />
          }
          onReplyInThread={roomId ? openThread : undefined}
          onBookmark={stubBookmark}
        />
      )}
    </article>
  )
}
