import { useParams } from 'react-router-dom'
import { useRooms } from './useRooms'
import type { ChatRoom, RoomId } from '@/types/chat'

export function useActiveRoom(): {
  roomId: RoomId | undefined
  room: ChatRoom | undefined
  isLoading: boolean
  isNotFound: boolean
} {
  const { roomId } = useParams<{ roomId: RoomId }>()
  const { data: rooms, isLoading } = useRooms()
  const room = rooms?.find((r) => r.id === roomId)
  return {
    roomId,
    room,
    isLoading,
    isNotFound: !isLoading && rooms != null && room == null,
  }
}
