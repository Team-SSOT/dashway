import type { SerializedEditorState } from 'lexical'
import type { ReactNode } from 'react'
import { RoomHeader } from './RoomHeader'
import { MessageList } from '@/features/messages/components/MessageList'
import { MessageComposer } from '@/features/composer/components/MessageComposer'
import { LoadingSpinner } from '@/features/messages/components/LoadingSpinner'
import { EmptyMessages } from '@/features/messages/components/EmptyMessages'
import { ErrorMessage } from '@/features/messages/components/ErrorMessage'
import type { ChatMember, ChatMessage, MessageAttachment, RoomId } from '@/types/chat'

interface ChatSurfaceProps {
  roomId: RoomId
  roomName: string
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
  onSend: (content: SerializedEditorState, plainText: string, attachments?: MessageAttachment[]) => void
}

export function ChatSurface({
  roomId,
  roomName,
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
}: ChatSurfaceProps) {
  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <RoomHeader roomName={roomName} topic={topic} />
        <div className="flex min-h-0 flex-1 flex-col">
          {messagesLoading ? (
            <LoadingSpinner label="Loading messages" className="flex-1" />
          ) : messagesError ? (
            <ErrorMessage message="Failed to load messages" className="flex-1" />
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <MessageList
              roomId={roomId}
              flatMessages={messages}
              members={members}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              lastReadAt={lastReadAt}
            />
          )}
        </div>
        <MessageComposer roomId={roomId} onSend={onSend} />
      </div>
      {threadPanel}
    </div>
  )
}
