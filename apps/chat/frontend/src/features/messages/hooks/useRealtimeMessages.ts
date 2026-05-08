import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { useIsLive } from '@/app/featureFlags'
import type { ChatMessage, Page, RoomId } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'

export function useRealtimeMessages(roomId: RoomId | undefined) {
  const { realtime } = useDataSource()
  const qc = useQueryClient()
  const isLive = useIsLive()

  useEffect(() => {
    if (!roomId) return
    const key = roomMessagesQueryKey(roomId)

    const unsubscribe = realtime.watchRoom(roomId, (event) => {
      if (event.type === 'MESSAGE_CREATED') {
        if (isLive) {
          // FE-inferred dedup: match optimistic row by clientMsgId or, when
          // BE has not yet echoed clientMessageId (V1.2 BE work), by
          // (optimistic authorId='0' from getCurrentUser sentinel + plainText
          // + ±5s). Skipping the authorId-equality check on the BE side stops
          // mismatches because optimistic rows carry '0' until V1.2 lands a
          // me-query for AuthProvider.memberId. Already server-confirmed rows
          // (authorId !== '0') are never re-replaced.
          const isPendingMatch = (m: ChatMessage): boolean => {
            if (m.clientMsgId && m.clientMsgId === event.message.clientMsgId) return true
            if (m.authorId !== '0') return false
            if (m.plainText !== event.message.plainText) return false
            const timeDiff = Math.abs(
              new Date(m.clientCreatedAt).getTime() -
                new Date(event.message.serverCreatedAt).getTime(),
            )
            return timeDiff <= 5000
          }

          qc.setQueryData<InfiniteData<Page<ChatMessage>>>(key, (old) => {
            if (!old || old.pages.length === 0) {
              return {
                pageParams: [undefined],
                pages: [{ items: [event.message], nextCursor: null, prevCursor: null }],
              }
            }
            const firstPage = old.pages[0]
            const existed = firstPage.items.some(isPendingMatch)
            const nextItems = existed
              ? firstPage.items.map((m) => (isPendingMatch(m) ? event.message : m))
              : [...firstPage.items, event.message]
            return {
              ...old,
              pages: [{ ...firstPage, items: nextItems }, ...old.pages.slice(1)],
            }
          })
          return
        }

        // Mock mode: append all incoming messages (existing behaviour).
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
        if (isLive) return // V1.1: message edit not supported in live mode
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
        if (isLive) return // V1.1: message delete not supported in live mode
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
  }, [roomId, realtime, qc, isLive])
}
