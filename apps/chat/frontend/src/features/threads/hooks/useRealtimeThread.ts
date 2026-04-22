import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { ChatMessage, MessageId, Page, RoomId } from '@/types/chat'
import { threadRepliesQueryKey } from './useThreadReplies'
import { roomMessagesQueryKey } from '@/features/messages/hooks/useRoomMessages'

/**
 * Subscribe to thread realtime events for `parentId` and mirror them into both
 *   - `['thread-replies', parentId]` — append/replace the reply in page[0]
 *   - `['messages', roomId]`         — bump parent's `replyCount` on new reply
 *
 * Uses `setQueryData` (no refetch) to keep the UI snappy.
 */
export function useRealtimeThread(
  roomId: RoomId | undefined,
  parentId: MessageId | undefined,
) {
  const { realtime } = useDataSource()
  const qc = useQueryClient()

  useEffect(() => {
    if (!roomId || !parentId) return
    const threadKey = threadRepliesQueryKey(parentId)
    const roomKey = roomMessagesQueryKey(roomId)

    const unsubscribe = realtime.watchThread(parentId, (event) => {
      if (event.type !== 'MESSAGE_CREATED' && event.type !== 'MESSAGE_UPDATED') return
      const msg = event.message
      if (msg.threadParentId !== parentId) return

      // Merge into thread replies cache
      qc.setQueryData<InfiniteData<Page<ChatMessage>>>(threadKey, (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pageParams: [undefined],
            pages: [{ items: [msg], nextCursor: null, prevCursor: null }],
          }
        }
        const firstPage = old.pages[0]
        const existed = firstPage.items.some((m) => m.clientMsgId === msg.clientMsgId)
        const nextItems = existed
          ? firstPage.items.map((m) => (m.clientMsgId === msg.clientMsgId ? msg : m))
          : [...firstPage.items, msg]
        return { ...old, pages: [{ ...firstPage, items: nextItems }, ...old.pages.slice(1)] }
      })

      // Bump parent's replyCount in room messages cache only for new replies.
      if (event.type === 'MESSAGE_CREATED') {
        qc.setQueryData<InfiniteData<Page<ChatMessage>>>(roomKey, (old) => {
          if (!old) return old
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === parentId ? { ...m, replyCount: m.replyCount + 1 } : m,
            ),
          }))
          return { ...old, pages }
        })
      }
    })

    return unsubscribe
  }, [roomId, parentId, realtime, qc])
}
