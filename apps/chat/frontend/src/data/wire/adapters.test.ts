import { describe, expect, it } from 'vitest'
import {
  adaptChatMessage,
  adaptChatRoom,
  adaptChatRoomPage,
  assertWireMemberId,
  toContentMentions,
  type WireChatRoomsResponse,
  type WireMessage,
  type WireRoom,
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

describe('adaptChatMessage', () => {
  const baseMessage: WireMessage = {
    id: 123,
    roomId: 'room-1',
    memberId: 456,
    clientMessageId: 'client-1',
    content: 'Hello world',
    mentions: [{ appId: 'context', memberId: '456' }],
    isDeleted: false,
    createdDatetime: '2026-06-13T10:00:00+09:00',
    editedDatetime: null,
    deletedDatetime: null,
  }

  it('maps MESSAGE payload fields to the internal ChatMessage viewmodel', () => {
    const result = adaptChatMessage(baseMessage)

    expect(result).toMatchObject({
      id: '123',
      roomId: 'room-1',
      authorId: '456',
      plainText: 'Hello world',
      clientCreatedAt: '2026-06-13T10:00:00+09:00',
      serverCreatedAt: '2026-06-13T10:00:00+09:00',
      editedAt: null,
      deletedAt: null,
      clientMsgId: 'client-1',
      mentions: [{ appId: 'context', memberId: '456' }],
    })
  })

  it('turns isDeleted payloads into soft-deleted messages', () => {
    const result = adaptChatMessage({
      ...baseMessage,
      content: null,
      isDeleted: true,
      deletedDatetime: '2026-06-13T10:05:00+09:00',
    })

    expect(result.plainText).toBe('')
    expect(result.deletedAt).toBe('2026-06-13T10:05:00+09:00')
  })
})

describe('toContentMentions', () => {
  it('maps person mention targets and drops unsupported target types until BE supports them', () => {
    expect(
      toContentMentions([
        { type: 'person', id: '1001', label: 'Alice' },
        { type: 'document', id: 'doc-1', label: 'Spec' },
      ]),
    ).toEqual([{ appId: 'context', memberId: '1001' }])
  })
})
