import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import type { SerializedEditorState } from 'lexical'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { useRoomMessages } from '@/features/messages/hooks/useRoomMessages'
import { useSendMessage } from '@/features/messages/hooks/useSendMessage'
import { useRoomMemberships } from '@/features/rooms/hooks/useRoomMemberships'
import { MOCK_MEMBERS } from '@/data/mockData'
import { MessageItem } from '@/features/messages/components/MessageItem'
import { MessageComposer } from '@/features/composer/components/MessageComposer'
import { AvatarStack } from '@/features/rooms/components/AvatarStack'
import { useUiStore } from '@/shared/store/uiStore'
import type { RoomId } from '@/types/chat'
import { useThreadReplies } from '../hooks/useThreadReplies'
import { useRealtimeThread } from '../hooks/useRealtimeThread'
import { ThreadReplyList } from './ThreadReplyList'

/**
 * ThreadPanel — right-pane view for a single thread.
 *
 * Reads `:roomId` + `:msgId` from the URL, hydrates the parent message from
 * the room messages cache, subscribes to thread realtime, and renders:
 *   [header with participants stack] [parent message] [replies] [composer].
 *
 * Escape closes the panel and navigates back to `/c/:roomId`.
 */
export function ThreadPanel() {
  const { roomId, msgId } = useParams<{ roomId: string; msgId: string }>()
  const navigate = useNavigate()
  const setRightPaneMode = useUiStore((s) => s.setRightPaneMode)

  const { data: messagesQuery } = useRoomMessages(roomId)
  const { data: repliesQuery, isLoading } = useThreadReplies(msgId)
  const { data: memberships } = useRoomMemberships(roomId)
  const sendReply = useSendMessage(roomId)
  useRealtimeThread(roomId, msgId)

  const parentMessage = useMemo(() => {
    return messagesQuery?.flat.find((m) => m.id === msgId)
  }, [messagesQuery, msgId])

  const replies = repliesQuery?.flat ?? []

  // Membership-filtered members list, fallback to all
  const members = useMemo(() => {
    const memberIds = new Set((memberships ?? []).map((m) => m.memberId))
    const filtered = MOCK_MEMBERS.filter((m) => memberIds.has(m.id))
    return filtered.length > 0 ? filtered : MOCK_MEMBERS
  }, [memberships])

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  // Participants = parent author + unique reply authors, in first-appearance order
  const participants = useMemo(() => {
    const ids = new Set<string>()
    if (parentMessage) ids.add(parentMessage.authorId)
    for (const r of replies) ids.add(r.authorId)
    return [...ids]
      .map((id) => membersById[id])
      .filter((x): x is NonNullable<typeof x> => !!x)
  }, [parentMessage, replies, membersById])

  // Keep uiStore in sync for sidebar/header consumers.
  useEffect(() => {
    setRightPaneMode('thread')
    return () => setRightPaneMode('closed')
  }, [setRightPaneMode])

  // Escape closes thread
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && roomId) navigate(`/c/${roomId}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, roomId])

  const handleSend = useCallback(
    (content: SerializedEditorState, plainText: string) => {
      if (!msgId) return
      sendReply.mutate({ content, plainText, threadParentId: msgId })
    },
    [sendReply, msgId],
  )

  const handleClose = () => {
    if (roomId) navigate(`/c/${roomId}`)
  }

  // TODO(drafts): composite draft key `${roomId}::thread::${msgId}` collides
  // with RoomId type shape but is tolerated since useDraft keys a Record<string, ...>.
  // Future refactor: introduce `DraftKey = RoomId | { kind: 'thread'; ... }`.
  const composerDraftKey =
    roomId && msgId ? (`${roomId}::thread::${msgId}` as RoomId) : undefined

  return (
    <aside
      className="flex h-full w-96 min-w-96 flex-col border-l border-border bg-card"
      aria-label="Thread"
    >
      <header className="flex h-12 items-center gap-2 border-b border-border px-3">
        <h2 className="text-sm font-semibold">Thread</h2>
        <AvatarStack members={participants} max={3} size="sm" className="ml-1" />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
          aria-label="Close thread"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {parentMessage ? (
          <div className="shrink-0">
            <MessageItem
              message={parentMessage}
              author={membersById[parentMessage.authorId]}
              membersById={membersById}
              compact={false}
            />
            <div className="px-4 py-2">
              <Separator />
              <p className="mt-2 text-xs text-muted-foreground">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : 'Parent message not found'}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <ThreadReplyList replies={replies} members={members} />
        </div>
      </div>

      {composerDraftKey ? (
        <MessageComposer
          roomId={composerDraftKey}
          onSend={handleSend}
          placeholder="Reply to thread…"
        />
      ) : null}
    </aside>
  )
}
