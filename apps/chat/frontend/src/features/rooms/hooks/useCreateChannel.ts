import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'
import { roomsQueryKey } from './useRooms'
import type { ChatRoom, CreateRoomInput } from '@/types/chat'

export function useCreateChannel() {
  const { repo } = useDataSource()
  const qc = useQueryClient()

  return useMutation<ChatRoom, Error, CreateRoomInput>({
    mutationFn: (input) => repo.createRoom(input),
    onSuccess: (room) => {
      qc.setQueryData<ChatRoom[]>(roomsQueryKey, (old) => [...(old ?? []), room])
      // No navigate here — caller handles routing after awaiting mutateAsync.
    },
  })
}
