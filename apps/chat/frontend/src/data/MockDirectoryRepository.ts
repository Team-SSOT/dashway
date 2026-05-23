import type { DirectoryRepository, SearchMembersInput, SearchMembersPage } from '@/data/DirectoryRepository'
import type { ChatMember } from '@/types/chat'
import { MOCK_MEMBERS, MOCK_MEMBERSHIPS } from '@/data/mockData'

export class MockDirectoryRepository implements DirectoryRepository {
  private readonly members: ChatMember[]

  constructor() {
    this.members = MOCK_MEMBERS.map((m) => ({ ...m }))
  }

  async searchMembers(input: SearchMembersInput): Promise<SearchMembersPage> {
    const { q, excludeRoomId, limit = 20, cursor } = input

    let candidates = this.members.slice()

    if (excludeRoomId) {
      const inRoom = new Set(
        MOCK_MEMBERSHIPS
          .filter((ms) => ms.roomId === excludeRoomId)
          .map((ms) => ms.memberId)
      )
      candidates = candidates.filter((m) => !inRoom.has(m.id))
    }

    if (q.length > 0) {
      const lower = q.toLowerCase()
      candidates = candidates.filter((m) => m.name.toLowerCase().includes(lower))
    }

    const offset = cursor ? parseInt(cursor, 10) : 0
    const slice = candidates.slice(offset, offset + limit + 1)
    const hasMore = slice.length > limit
    const items = hasMore ? slice.slice(0, limit) : slice
    const nextCursor = hasMore ? String(offset + limit) : null

    return { items, nextCursor }
  }
}
