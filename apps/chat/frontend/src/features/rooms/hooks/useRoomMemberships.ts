import { useQuery } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import type { RoomId } from '@/types/chat'

export const roomMembershipsQueryKey = (roomId: RoomId) => ['room-memberships', roomId] as const

export function useRoomMemberships(roomId: RoomId | undefined) {
  const { repo } = useDataSource()
  return useQuery({
    enabled: !!roomId,
    queryKey: roomId ? roomMembershipsQueryKey(roomId) : ['room-memberships', 'none'],
    queryFn: () => repo.listMemberships(roomId as RoomId),
  })
}
