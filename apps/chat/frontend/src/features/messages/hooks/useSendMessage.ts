import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SerializedEditorState } from 'lexical'
import { useAuthToken } from '@/app/providers/AuthProvider'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { currentUserId } from '@/data/mockData'
import type {
  ChatMessage,
  ContentMention,
  MessageAttachment,
  Page,
  RoomId,
  SendMessageInput,
} from '@/types/chat'
import { makeClientMessageId } from '../model/clientMessageId'
import { roomMessagesQueryKey } from './useRoomMessages'

// Consumed by MessageList scroll policy (messageListScrollPolicy.ts).
export const OPTIMISTIC_ID_PREFIX = 'pending-'

interface SendArgs {
  roomId: RoomId
  content: SerializedEditorState
  plainText: string
  mentions?: ContentMention[]
  threadParentId?: string
  attachments?: MessageAttachment[]
}

function makeOptimisticMessage(args: SendArgs, clientMsgId: string, authorId: string): ChatMessage {
  const now = new Date().toISOString()
  const mentions = args.mentions ?? []
  return {
    id: `${OPTIMISTIC_ID_PREFIX}${clientMsgId}`,
    roomId: args.roomId,
    authorId,
    content: args.content,
    plainText: args.plainText,
    clientCreatedAt: now,
    serverCreatedAt: now,
    editedAt: null,
    deletedAt: null,
    threadParentId: args.threadParentId ?? null,
    replyCount: 0,
    clientMsgId,
    contentVersion: 1,
    version: 0,
    mentions,
    attachments: args.attachments && args.attachments.length > 0 ? args.attachments : undefined,
  }
}

type MutationArgs = Omit<SendArgs, 'roomId'> & { __clientMsgId?: string }

export function useSendMessage(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  const { memberId } = useAuthToken()
  const qc = useQueryClient()

  return useMutation<
    ChatMessage,
    Error,
    MutationArgs,
    { clientMsgId: string; previous?: InfiniteData<Page<ChatMessage>> }
  >({
    mutationFn: async (args) => {
      if (!roomId) throw new Error('No active room')
      const clientMsgId = args.__clientMsgId ?? makeClientMessageId()
      const input: SendMessageInput = {
        roomId,
        content: args.content,
        plainText: args.plainText,
        clientMsgId,
        mentions: args.mentions ?? [],
        threadParentId: args.threadParentId,
        clientCreatedAt: new Date().toISOString(),
        attachments: args.attachments,
      }
      return repo.sendMessage(input)
    },
    onMutate: async (args) => {
      if (!roomId) return { clientMsgId: '', previous: undefined }
      const key = roomMessagesQueryKey(roomId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<Page<ChatMessage>>>(key)
      const clientMsgId = makeClientMessageId()
      args.__clientMsgId = clientMsgId
      const optimistic = makeOptimisticMessage(
        { ...args, roomId },
        clientMsgId,
        memberId ?? currentUserId,
      )

      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [
              {
                items: [optimistic],
                nextCursor: null,
                prevCursor: null,
              } satisfies Page<ChatMessage>,
            ],
          }
        }
        const firstPage = old.pages[0]
        const nextFirst: Page<ChatMessage> = {
          ...firstPage,
          items: [...firstPage.items, optimistic],
        }
        return { ...old, pages: [nextFirst, ...old.pages.slice(1)] }
      })
      return { clientMsgId, previous }
    },
    onError: (_err, _args, context) => {
      if (!roomId || !context?.previous) return
      qc.setQueryData(roomMessagesQueryKey(roomId), context.previous)
    },
    onSuccess: (serverMsg, _args, context) => {
      if (!roomId || !context) return
      const key = roomMessagesQueryKey(roomId)
      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
        if (!old) return old
        const pages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((m) => (m.clientMsgId === context.clientMsgId ? serverMsg : m)),
        }))
        return { ...old, pages }
      })
    },
  })
}
