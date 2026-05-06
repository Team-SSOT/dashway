import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { ChatMessage, Page, RoomId } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'

export function useRealtimeMessages(roomId: RoomId | undefined) {
  const { realtime } = useDataSource()
  const qc = useQueryClient()

  useEffect(() => {
    if (!roomId) return
    const key = roomMessagesQueryKey(roomId)

    const unsubscribe = realtime.watchRoom(roomId, (event) => {
      if (event.type === 'MESSAGE_CREATED') {
        qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
          if (!old || old.pages.length === 0) {
            return {
              pageParams: [undefined],
              pages: [{ items: [event.message], nextCursor: null, prevCursor: null }],
            }
          }
          const firstPage = old.pages[0]
          const replaced = firstPage.items.map((m) =>
            m.clientMsgId === event.message.clientMsgId ? event.message : m,
          )
          const existed = firstPage.items.some(
            (m) => m.clientMsgId === event.message.clientMsgId,
          )
          const nextItems = existed ? replaced : [...firstPage.items, event.message]
          return {
            ...old,
            pages: [{ ...firstPage, items: nextItems }, ...old.pages.slice(1)],
          }
        })
      } else if (event.type === 'MESSAGE_UPDATED') {
        qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
          if (!old) return old
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === event.message.id ? event.message : m,
            ),
          }))
          return { ...old, pages }
        })
      } else if (event.type === 'MESSAGE_DELETED') {
        qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
          if (!old) return old
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === event.messageId ? { ...m, deletedAt: event.deletedAt } : m,
            ),
          }))
          return { ...old, pages }
        })
      }
      // ROOM_READ, MEMBERSHIP_CHANGED — later milestones
    })

    return unsubscribe
  }, [roomId, realtime, qc])
}
