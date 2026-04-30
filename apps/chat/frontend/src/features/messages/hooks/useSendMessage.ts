import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { SerializedEditorState } from 'lexical'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { ChatMessage, MessageAttachment, Page, RoomId, SendMessageInput } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'
import { currentUserId } from '@/data/mockData'

interface SendArgs {
  roomId: RoomId
  content: SerializedEditorState
  plainText: string
  threadParentId?: string
  attachments?: MessageAttachment[]
}

function makeClientMsgId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeOptimisticMessage(args: SendArgs, clientMsgId: string): ChatMessage {
  const now = new Date().toISOString()
  return {
    id: `pending-${clientMsgId}`,
    roomId: args.roomId,
    authorId: currentUserId,
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
    attachments: args.attachments && args.attachments.length > 0 ? args.attachments : undefined,
  }
}

type MutationArgs = Omit<SendArgs, 'roomId'> & { __clientMsgId?: string }

export function useSendMessage(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  const qc = useQueryClient()

  return useMutation<
    ChatMessage,
    Error,
    MutationArgs,
    { clientMsgId: string; previous?: InfiniteData<Page<ChatMessage>> }
  >({
    mutationFn: async (args) => {
      if (!roomId) throw new Error('No active room')
      const clientMsgId = args.__clientMsgId ?? makeClientMsgId()
      const input: SendMessageInput = {
        roomId,
        content: args.content,
        plainText: args.plainText,
        clientMsgId,
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
      const clientMsgId = makeClientMsgId()
      args.__clientMsgId = clientMsgId
      const optimistic = makeOptimisticMessage({ ...args, roomId }, clientMsgId)

      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ items: [optimistic], nextCursor: null, prevCursor: null } satisfies Page<ChatMessage>],
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
          items: page.items.map((m) =>
            m.clientMsgId === context.clientMsgId ? serverMsg : m,
          ),
        }))
        return { ...old, pages }
      })
    },
  })
}
