import { useQuery } from '@tanstack/react-query'
import { useDataSource } from '@/app/providers/DataSourceProvider'

export const roomsQueryKey = ['rooms'] as const

export function useRooms() {
  const { repo } = useDataSource()
  return useQuery({
    queryKey: roomsQueryKey,
    queryFn: () => repo.listRooms(),
  })
}
