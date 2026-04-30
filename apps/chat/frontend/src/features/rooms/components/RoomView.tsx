import type { SerializedEditorState } from 'lexical'
import { useParams } from 'react-router-dom'
import type { MessageAttachment } from '@/types/chat'
import { ChatSurface } from './ChatSurface'
import { LoadingSpinner } from '@/features/messages/components/LoadingSpinner'
import { ThreadPanel } from '@/features/threads/components/ThreadPanel'
import { useActiveRoom } from '../hooks/useActiveRoom'
import { useRoomMessages } from '@/features/messages/hooks/useRoomMessages'
import { useRoomMemberships } from '../hooks/useRoomMemberships'
import { useSendMessage } from '@/features/messages/hooks/useSendMessage'
import { useRealtimeMessages } from '@/features/messages/hooks/useRealtimeMessages'
// TODO(M2): Replace with useMembersByIds hook backed by ChatRepository
import { MOCK_MEMBERS, currentUserId } from '@/data/mockData'

export function RoomView() {
  const { roomId, room, isLoading: roomsLoading, isNotFound } = useActiveRoom()
  const { msgId } = useParams<{ msgId?: string }>()
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

  const handleSend = (
    content: SerializedEditorState,
    plainText: string,
    attachments?: MessageAttachment[],
  ) => {
    sendMessage.mutate({ content, plainText, attachments })
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

  const messages = messagesQuery?.flat ?? []
  const currentMembership = (memberships ?? []).find((m) => m.memberId === currentUserId)
  const lastReadAt = currentMembership?.lastReadAt ?? null

  return (
    <ChatSurface
      roomId={roomId}
      roomName={room.name}
      topic={room.topic ?? room.description}
      messages={messages}
      members={membersForRender}
      lastReadAt={lastReadAt}
      messagesLoading={messagesLoading}
      messagesError={messagesError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      threadPanel={msgId ? <ThreadPanel /> : null}
      onSend={handleSend}
    />
  )
}
