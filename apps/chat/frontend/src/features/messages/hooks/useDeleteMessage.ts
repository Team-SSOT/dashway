import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { ChatMessage, MessageId, Page, RoomId } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'

export function useDeleteMessage(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  const qc = useQueryClient()

  return useMutation<
    void,
    Error,
    { messageId: MessageId },
    { previous?: InfiniteData<Page<ChatMessage>> }
  >({
    mutationFn: ({ messageId }) => repo.deleteMessage(messageId),
    onMutate: async ({ messageId }) => {
      if (!roomId) return {}
      const key = roomMessagesQueryKey(roomId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<Page<ChatMessage>>>(key)
      const now = new Date().toISOString()
      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
        if (!old) return old
        const pages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((m) =>
            m.id === messageId ? { ...m, deletedAt: now } : m,
          ),
        }))
        return { ...old, pages }
      })
      return { previous }
    },
    onError: (_err, _args, context) => {
      if (!roomId || !context?.previous) return
      qc.setQueryData(roomMessagesQueryKey(roomId), context.previous)
    },
  })
}
