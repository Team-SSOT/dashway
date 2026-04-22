import { useInfiniteQuery } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { MessageId, Cursor, Page, ChatMessage } from '@/types/chat'

export const threadRepliesQueryKey = (parentId: MessageId) =>
  ['thread-replies', parentId] as const

export interface ThreadRepliesSelection {
  pages: Page<ChatMessage>[]
  flat: ChatMessage[]
}

export function useThreadReplies(parentId: MessageId | undefined) {
  const { repo } = useDataSource()
  return useInfiniteQuery<
    Page<ChatMessage>,
    Error,
    ThreadRepliesSelection,
    readonly unknown[],
    Cursor | undefined
  >({
    enabled: !!parentId,
    queryKey: parentId ? threadRepliesQueryKey(parentId) : ['thread-replies', 'none'],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      repo.listThreadReplies(parentId as MessageId, { cursor: pageParam, limit: 50 }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
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
