import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useDirectory } from '@/app/providers/DataSourceProvider'
import type { RoomId } from '@/types/chat'

export const memberSearchQueryKey = (q: string, excludeRoomId?: RoomId) =>
  ['member-search', { q, excludeRoomId }] as const

export function useSearchMembers(q: string, excludeRoomId?: RoomId) {
  const directory = useDirectory()
  return useQuery({
    enabled: q.length >= 1,
    queryKey: memberSearchQueryKey(q, excludeRoomId),
    queryFn: () => directory.searchMembers({ q, excludeRoomId, limit: 20 }),
    placeholderData: keepPreviousData,
  })
}
