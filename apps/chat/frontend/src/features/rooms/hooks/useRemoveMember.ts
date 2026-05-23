import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { roomMembershipsQueryKey } from './useRoomMemberships'
import type { MemberId, RoomId, RoomMembership } from '@/types/chat'

export function useRemoveMember(roomId: RoomId) {
  const { repo } = useDataSource()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: MemberId) => repo.removeMember(roomId, memberId),
    onMutate: async (memberId) => {
      const key = roomMembershipsQueryKey(roomId)
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<RoomMembership[]>(key)
      qc.setQueryData<RoomMembership[]>(key, (prev) => (prev ?? []).filter((m) => m.memberId !== memberId))
      return { snapshot }
    },
    onError: (_err, _memberId, ctx) => {
      const key = roomMembershipsQueryKey(roomId)
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: roomMembershipsQueryKey(roomId) })
    },
  })
}
