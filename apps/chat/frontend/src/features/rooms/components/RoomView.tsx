import type { SerializedEditorState } from 'lexical'
import { useParams } from 'react-router-dom'
import { RoomHeader } from './RoomHeader'
import { MessageList } from '@/features/messages/components/MessageList'
import { MessageComposer } from '@/features/composer/components/MessageComposer'
import { LoadingSpinner } from '@/features/messages/components/LoadingSpinner'
import { EmptyMessages } from '@/features/messages/components/EmptyMessages'
import { ErrorMessage } from '@/features/messages/components/ErrorMessage'
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

  const handleSend = (content: SerializedEditorState, plainText: string) => {
    sendMessage.mutate({ content, plainText })
  }

  if (roomsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner label="Loading" />
      </div>
    )
  }

  if (isNotFound || !room) {
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
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <RoomHeader roomName={room.name} topic={room.topic ?? room.description} />
        <div className="flex min-h-0 flex-1 flex-col">
          {messagesLoading ? (
            <LoadingSpinner label="Loading messages" className="flex-1" />
          ) : messagesError ? (
            <ErrorMessage message="Failed to load messages" className="flex-1" />
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : roomId ? (
            <MessageList
              roomId={roomId}
              flatMessages={messages}
              members={membersForRender}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              lastReadAt={lastReadAt}
            />
          ) : null}
        </div>
        {roomId ? <MessageComposer roomId={roomId} onSend={handleSend} /> : null}
      </div>
      {msgId ? <ThreadPanel /> : null}
    </div>
  )
}
