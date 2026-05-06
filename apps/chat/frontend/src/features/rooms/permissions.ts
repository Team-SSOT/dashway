import type { MemberId, RoomRole } from '@/types/chat'

export function canManageMembers(role: RoomRole | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}

export function canDeleteMessage(args: {
  role: RoomRole | undefined
  authorId: MemberId
  currentUserId: MemberId
}): boolean {
  const { role, authorId, currentUserId } = args
  if (authorId === currentUserId) return true
  return role === 'OWNER' || role === 'ADMIN'
}
