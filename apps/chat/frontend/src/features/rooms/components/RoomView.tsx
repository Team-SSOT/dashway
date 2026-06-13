import type { SerializedEditorState } from 'lexical'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
// TODO(M2): Replace with useMembersByIds hook backed by ChatRepository
import { currentUserId, MOCK_MEMBERS } from '@/data/mockData'
import { LoadingSpinner } from '@/features/messages/components/LoadingSpinner'
import { useRealtimeMessages } from '@/features/messages/hooks/useRealtimeMessages'
import { useRoomMessages } from '@/features/messages/hooks/useRoomMessages'
import { useSendMessage } from '@/features/messages/hooks/useSendMessage'
import { ThreadPanel } from '@/features/threads/components/ThreadPanel'
import { useUiStore } from '@/shared/store/uiStore'
import type { ContentMention, MessageAttachment } from '@/types/chat'
import { useActiveRoom } from '../hooks/useActiveRoom'
import { useRoomMemberships } from '../hooks/useRoomMemberships'
import { ChatSurface } from './ChatSurface'
import { MembersPanel } from './MembersPanel'

export function RoomView() {
  const { roomId, room, isLoading: roomsLoading, isNotFound } = useActiveRoom()
  const { msgId } = useParams<{ msgId?: string }>()
  const [searchParams] = useSearchParams()
  const targetMessageId = searchParams.get('m') ?? null
  const setRightPaneMode = useUiStore((s) => s.setRightPaneMode)
  const [membersOpen, setMembersOpen] = useState(false)
  const {
    data: messagesQuery,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useRoomMessages(roomId)
  const { data: memberships } = useRoomMemberships(roomId)
  useRealtimeMessages(roomId)
  const sendMessage = useSendMessage(roomId)

  // Force members panel closed when a thread is open — URL wins.
  useEffect(() => {
    if (msgId) setMembersOpen(false)
  }, [msgId])

  // RoomView is the sole writer of rightPaneMode.
  const mode = msgId ? 'thread' : membersOpen ? 'members' : 'closed'
  useEffect(() => {
    setRightPaneMode(mode)
  }, [mode, setRightPaneMode])

  const handleSend = (
    content: SerializedEditorState,
    plainText: string,
    mentions: ContentMention[],
    attachments?: MessageAttachment[],
  ) => {
    sendMessage.mutate({ content, plainText, mentions, attachments })
  }

  if (roomsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner label="Loading" />
      </div>
    )
  }

  if (!roomId || isNotFound || !room) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">404</p>
          <h2 className="mt-2 text-xl font-semibold">Channel not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The channel &ldquo;{roomId}&rdquo; does not exist.
          </p>
        </div>
      </div>
    )
  }

  // Resolve members-in-room from memberships (fallback: all mock members if memberships not loaded)
  const roomMemberIds = new Set((memberships ?? []).map((m) => m.memberId))
  const roomMembers = MOCK_MEMBERS.filter((m) => roomMemberIds.has(m.id))
  const membersForRender = roomMembers.length > 0 ? roomMembers : MOCK_MEMBERS
  const peerMember =
    room.type === 'DM' && room.peerMemberId
      ? MOCK_MEMBERS.find((m) => m.id === room.peerMemberId)
      : undefined

  const messages = messagesQuery?.flat ?? []
  const currentMembership = (memberships ?? []).find((m) => m.memberId === currentUserId)
  const lastReadAt = currentMembership?.lastReadAt ?? null

  const rightPanel = msgId ? (
    <ThreadPanel />
  ) : membersOpen ? (
    <MembersPanel roomId={roomId} onClose={() => setMembersOpen(false)} />
  ) : null

  return (
    <ChatSurface
      roomId={roomId}
      roomName={room.name}
      roomType={room.type}
      peerMember={peerMember}
      topic={room.topic ?? room.description}
      messages={messages}
      members={membersForRender}
      lastReadAt={lastReadAt}
      messagesLoading={messagesLoading}
      messagesError={messagesError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      threadPanel={rightPanel}
      onMembersToggle={() => setMembersOpen((o) => !o)}
      membersOpen={membersOpen}
      onSend={handleSend}
      targetMessageId={targetMessageId}
    />
  )
}
