import type { SerializedEditorState } from 'lexical'
import type { ReactNode } from 'react'
import { MessageComposer } from '@/features/composer/components/MessageComposer'
import { EmptyMessages } from '@/features/messages/components/EmptyMessages'
import { ErrorMessage } from '@/features/messages/components/ErrorMessage'
import { LoadingSpinner } from '@/features/messages/components/LoadingSpinner'
import { MessageList } from '@/features/messages/components/MessageList'
import type {
  ChatMember,
  ChatMessage,
  ContentMention,
  MessageAttachment,
  RoomId,
  RoomType,
} from '@/types/chat'
import { RoomHeader } from './RoomHeader'

interface ChatSurfaceProps {
  roomId: RoomId
  roomName: string
  roomType?: RoomType
  peerMember?: ChatMember
  topic?: string
  messages: ChatMessage[]
  members: ChatMember[]
  lastReadAt: string | null
  messagesLoading: boolean
  messagesError: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  threadPanel?: ReactNode
  onSend: (
    content: SerializedEditorState,
    plainText: string,
    mentions: ContentMention[],
    attachments?: MessageAttachment[],
  ) => void
  onMembersToggle?: () => void
  membersOpen?: boolean
  /** Optional message id from `?m=` query param — MessageList scrolls + flashes on mount. */
  targetMessageId?: string | null
}

export function ChatSurface({
  roomId,
  roomName,
  roomType,
  peerMember,
  topic,
  messages,
  members,
  lastReadAt,
  messagesLoading,
  messagesError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threadPanel,
  onSend,
  onMembersToggle,
  membersOpen,
  targetMessageId,
}: ChatSurfaceProps) {
  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <RoomHeader
          roomName={roomName}
          roomType={roomType}
          peerMember={peerMember}
          topic={topic}
          onMembersToggle={onMembersToggle}
          membersOpen={membersOpen}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          {messagesLoading ? (
            <LoadingSpinner label="Loading messages" className="flex-1" />
          ) : messagesError ? (
            <ErrorMessage message="Failed to load messages" className="flex-1" />
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <MessageList
              key={roomId}
              roomId={roomId}
              flatMessages={messages}
              members={members}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              lastReadAt={lastReadAt}
              targetMessageId={targetMessageId}
            />
          )}
        </div>
        <MessageComposer roomId={roomId} onSend={onSend} />
      </div>
      {threadPanel}
    </div>
  )
}
