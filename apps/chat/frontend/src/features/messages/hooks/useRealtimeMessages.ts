import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { useAuthToken } from '@/app/providers/AuthProvider'
import { useIsLive } from '@/app/featureFlags'
import type { ChatMessage, Page, RoomId } from '@/types/chat'
import { roomMessagesQueryKey } from './useRoomMessages'

export function useRealtimeMessages(roomId: RoomId | undefined) {
  const { realtime } = useDataSource()
  const { memberId: currentMemberId } = useAuthToken()
  const qc = useQueryClient()
  const isLive = useIsLive()

  useEffect(() => {
    if (!roomId) return
    const key = roomMessagesQueryKey(roomId)

    const unsubscribe = realtime.watchRoom(roomId, (event) => {
      if (event.type === 'MESSAGE_CREATED') {
        if (isLive) {
          // V1.1: only append self-echo to cache (optimistic row replacement).
          // Other senders' messages are intentionally skipped until V1.2 when
          // useRoomMessages live wiring is complete.
          const isSelfEcho =
            currentMemberId !== null &&
            event.message.authorId === currentMemberId
          // FE-inferred dedup: match pending row by (authorId, plainText, ±5s)
          // when BE doesn't echo clientMsgId yet (V1.1). Replaced by exact
          // clientMsgId match once BE adds echo (V1.2 BE work).
          const isPendingMatch = (m: ChatMessage): boolean => {
            if (m.clientMsgId === event.message.clientMsgId) return true
            const timeDiff = Math.abs(
              new Date(m.clientCreatedAt).getTime() -
                new Date(event.message.serverCreatedAt).getTime(),
            )
            return (
              m.authorId === event.message.authorId &&
              m.plainText === event.message.plainText &&
              timeDiff <= 5000
            )
          }

          if (!isSelfEcho) return

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
  }, [roomId, realtime, qc, isLive, currentMemberId])
}
