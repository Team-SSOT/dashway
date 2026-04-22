/**
 * useRoomMessages — cursor-based infinite history for a channel.
 *
 * Cursor semantics note:
 *   MockChatRepository.listMessages returns a `nextCursor` that points to the
 *   NEXT page of OLDER messages (i.e. history prepend). So in useInfiniteQuery
 *   terms, `getNextPageParam(lastPage) => lastPage.nextCursor` gives us the
 *   "older-history" cursor. "fetchNextPage" therefore means "load older
 *   messages" — which is what we want for top-sentinel infinite scroll.
 *
 *   `prevCursor` is unused (returned as `null` by the mock); we don't need a
 *   forward direction because realtime events append new messages live.
 *
 * Select:
 *   Each page is already chronological asc within itself. We flatten all pages,
 *   dedupe by `id`, and sort ascending by `serverCreatedAt` so consumers can
 *   treat `flat` as "oldest → newest".
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { ChatMessage, Cursor, Page, RoomId } from '@/types/chat'

export const roomMessagesQueryKey = (roomId: RoomId) => ['messages', roomId] as const

export interface RoomMessagesSelection {
  pages: Page<ChatMessage>[]
  flat: ChatMessage[]
}

export function useRoomMessages(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  return useInfiniteQuery<
    Page<ChatMessage>,
    Error,
    RoomMessagesSelection,
    readonly unknown[],
    Cursor | undefined
  >({
    enabled: !!roomId,
    queryKey: roomId ? roomMessagesQueryKey(roomId) : ['messages', 'none'],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      repo.listMessages({ roomId: roomId as RoomId, cursor: pageParam, limit: 50 }),
    // nextCursor points to OLDER history (see module comment). "fetchNextPage"
    // = "prepend older messages" here.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => {
      const all = data.pages.flatMap((p) => p.items)
      const uniq = new Map<string, ChatMessage>()
      for (const m of all) uniq.set(m.id, m)
      const flat = [...uniq.values()].sort(
        (a, b) =>
          new Date(a.serverCreatedAt).getTime() - new Date(b.serverCreatedAt).getTime(),
      )
      return { pages: data.pages, flat }
    },
  })
}
