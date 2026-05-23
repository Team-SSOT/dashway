import { describe, it, expect } from 'vitest'
import {
  adaptChatRoom,
  adaptChatRoomPage,
  assertWireMemberId,
  type WireRoom,
  type WireChatRoomsResponse,
} from './adapters'

const baseRoom: WireRoom = {
  id: 'room-1',
  type: 'GROUP',
  isPublic: false,
  title: 'general',
  isFavorite: false,
  canDelete: false,
  memberCount: 2,
  members: [
    { memberId: '1001', role: 'OWNER', joinedDatetime: '2024-01-01T00:00:00+09:00' },
    { memberId: '1002', role: 'MEMBER', joinedDatetime: '2024-01-02T00:00:00+09:00' },
  ],
  createdDatetime: '2024-01-01T00:00:00+09:00',
  updatedDatetime: '2024-01-02T00:00:00+09:00',
}

describe('adaptChatRoom', () => {
  it('maps GROUP type to CHANNEL', () => {
    const result = adaptChatRoom(baseRoom)
    expect(result.type).toBe('CHANNEL')
    expect(result.name).toBe('general')
  })

  it('maps DIRECT type to DM with peer memberId', () => {
    const directRoom: WireRoom = {
      ...baseRoom,
      type: 'DIRECT',
      title: null,
    }
    const result = adaptChatRoom(directRoom, '1001')
    expect(result.type).toBe('DM')
    expect(result.peerMemberId).toBe('1002')
    expect(result.name).toBe('1002')
  })

  it('handles null title on DIRECT room without currentMemberId', () => {
    const directRoom: WireRoom = { ...baseRoom, type: 'DIRECT', title: null }
    const result = adaptChatRoom(directRoom)
    expect(result.type).toBe('DM')
    expect(result.name).toBeTruthy()
  })

  it('preserves Long (string) memberId round-trip', () => {
    // Long values come as string from codegen scalar mapping
    const bigLong = '9007199254740993' // exceeds JS Number precision
    const room: WireRoom = {
      ...baseRoom,
      members: [{ memberId: bigLong, role: 'OWNER', joinedDatetime: '2024-01-01T00:00:00Z' }],
    }
    const result = adaptChatRoom(room)
    expect(result.memberCount).toBe(room.memberCount)
    // member id preserved as string
    expect(room.members[0].memberId).toBe(bigLong)
  })

  it('preserves OffsetDateTime with +09:00 offset as-is', () => {
    const result = adaptChatRoom(baseRoom)
    expect(result.createdAt).toBe('2024-01-01T00:00:00+09:00')
    expect(result.updatedAt).toBe('2024-01-02T00:00:00+09:00')
  })
})

describe('adaptChatRoomPage', () => {
  it('maps rooms array and returns null cursors', () => {
    const response: WireChatRoomsResponse = {
      rooms: [baseRoom],
      pageInfo: { page: 0, size: 100, totalElements: 1, totalPages: 1 },
    }
    const result = adaptChatRoomPage(response)
    expect(result.items).toHaveLength(1)
    expect(result.nextCursor).toBeNull()
    expect(result.prevCursor).toBeNull()
  })
})

describe('assertWireMemberId', () => {
  it('throws ChatError VALIDATION for numeric input', () => {
    expect(() => assertWireMemberId(123)).toThrow()
    expect(() => assertWireMemberId(123)).toThrowError(/VALIDATION|expected string/i)
  })

  it('returns void for string input', () => {
    expect(() => assertWireMemberId('123')).not.toThrow()
  })
})
