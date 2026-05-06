import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { currentUserId } from '@/data/mockData'
import type { ChatMessage, MessageId, Page, Reaction, RoomId } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'

interface ToggleArgs {
  messageId: MessageId
  emoji: string
  /** True if the current user has already reacted with this emoji (toggle direction). */
  hasMine: boolean
}

function applyToggle(reactions: Reaction[] | undefined, emoji: string, hasMine: boolean): Reaction[] | undefined {
  const current = reactions ?? []
  const existing = current.find((r) => r.emoji === emoji)
  let next: Reaction[]
  if (hasMine) {
    if (!existing) return current.length > 0 ? current : undefined
    const filtered = existing.userIds.filter((id) => id !== currentUserId)
    next = filtered.length === 0
      ? current.filter((r) => r.emoji !== emoji)
      : current.map((r) => (r.emoji === emoji ? { ...r, userIds: filtered } : r))
  } else {
    if (existing) {
      if (existing.userIds.includes(currentUserId)) return current
      next = current.map((r) =>
        r.emoji === emoji ? { ...r, userIds: [...r.userIds, currentUserId] } : r,
      )
    } else {
      next = [...current, { emoji, userIds: [currentUserId] }]
    }
  }
  return next.length > 0 ? next : undefined
}

export function useToggleReaction(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  const qc = useQueryClient()

  return useMutation<
    ChatMessage,
    Error,
    ToggleArgs,
    { previous?: InfiniteData<Page<ChatMessage>> }
  >({
    mutationFn: async ({ messageId, emoji, hasMine }) =>
      hasMine ? repo.removeReaction(messageId, emoji) : repo.addReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji, hasMine }) => {
      if (!roomId) return {}
      const key = roomMessagesQueryKey(roomId)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<Page<ChatMessage>>>(key)
      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
        if (!old) return old
        const pages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((m) =>
            m.id === messageId
              ? { ...m, reactions: applyToggle(m.reactions, emoji, hasMine) }
              : m,
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
    onSuccess: (serverMsg) => {
      if (!roomId) return
      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(
        roomMessagesQueryKey(roomId),
        (old) => {
          if (!old) return old
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => (m.id === serverMsg.id ? serverMsg : m)),
          }))
          return { ...old, pages }
        },
      )
    },
  })
}

export const __test__ = { applyToggle }
