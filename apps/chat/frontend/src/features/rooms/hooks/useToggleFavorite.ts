import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { roomsQueryKey } from './useRooms'
import type { ChatRoom, RoomId } from '@/types/chat'

interface ToggleInput {
  roomId: RoomId
  next: boolean
}

export function useToggleFavorite() {
  const { repo } = useDataSource()
  const qc = useQueryClient()

  return useMutation<ChatRoom, Error, ToggleInput, { previous?: ChatRoom[] }>({
    mutationFn: ({ roomId, next }) => repo.setRoomFavorite(roomId, next),
    onMutate: async ({ roomId, next }) => {
      await qc.cancelQueries({ queryKey: roomsQueryKey })
      const previous = qc.getQueryData<ChatRoom[]>(roomsQueryKey)
      if (previous) {
        qc.setQueryData<ChatRoom[]>(
          roomsQueryKey,
          previous.map((r) => (r.id === roomId ? { ...r, isFavorite: next } : r)),
        )
      }
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(roomsQueryKey, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: roomsQueryKey })
    },
  })
}
