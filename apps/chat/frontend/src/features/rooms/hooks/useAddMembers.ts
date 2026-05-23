import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { roomMembershipsQueryKey } from './useRoomMemberships'
import type { MemberId, RoomId } from '@/types/chat'

export function useAddMembers(roomId: RoomId) {
  const { repo } = useDataSource()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberIds: MemberId[]) => repo.addMembers(roomId, memberIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomMembershipsQueryKey(roomId) })
    },
  })
}
