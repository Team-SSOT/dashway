import type { ChatMember, MemberId, RoomId } from '@/types/chat'

export interface SearchMembersInput {
  q: string
  excludeRoomId?: RoomId
  limit?: number
  cursor?: string
}

export interface SearchMembersPage {
  items: ChatMember[]
  nextCursor: string | null
}

export interface DirectoryRepository {
  searchMembers(input: SearchMembersInput): Promise<SearchMembersPage>
}

export type { ChatMember, MemberId }
