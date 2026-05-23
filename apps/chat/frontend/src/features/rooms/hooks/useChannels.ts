import { useRooms } from './useRooms'
import type { ChatRoom } from '@/types/chat'

export function useChannels() {
  const { data: rooms = [], ...rest } = useRooms()
  return { ...rest, data: rooms.filter((r): r is ChatRoom & { type: 'CHANNEL' } => r.type === 'CHANNEL') }
}
