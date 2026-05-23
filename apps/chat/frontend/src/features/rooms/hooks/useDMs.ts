import { useRooms } from './useRooms'
import type { ChatRoom } from '@/types/chat'

export function useDMs() {
  const { data: rooms = [], ...rest } = useRooms()
  return { ...rest, data: rooms.filter((r): r is ChatRoom & { type: 'DM' } => r.type === 'DM') }
}
