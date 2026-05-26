import type {
  ChatRepository,
  ChatMember,
  ChatRoom,
  ChatMessage,
  RoomMembership,
  Page,
  ChatError,
  ListMessagesInput,
  SendMessageInput,
  CreateRoomInput,
  RoomId,
  MemberId,
  MessageId,
} from '@/types/chat'
import type { MockEventBus } from '@/data/mockEventBus'
import {
  MOCK_MEMBERS,
  MOCK_ROOMS,
  MOCK_MEMBERSHIPS,
  MOCK_MESSAGES,
  currentUserId,
} from '@/data/mockData'
import {
  HEAVY_ROOM_ID,
  MOCK_ROOMS_HEAVY,
  generateHeavyMessages,
} from '@/data/mockData.heavy'

function makeChatError(
  code: ChatError['code'],
  message: string,
  retriable: boolean
): ChatError {
  return { code, message, retriable }
}

function rejectChatError(error: ChatError): Promise<never> {
  return Promise.reject(error)
}

export class MockChatRepository implements ChatRepository {
  private members: ChatMember[]
  private rooms: ChatRoom[]
  private memberships: RoomMembership[]
  private messages: ChatMessage[]

  /** One-shot per-method error flags. Key = method name. */
  private oneShot = new Map<string, ChatError>()

  constructor(private readonly bus: MockEventBus) {
    this.members = MOCK_MEMBERS.map((m) => ({ ...m }))
    this.rooms = MOCK_ROOMS.map((r) => ({ ...r }))
    this.memberships = MOCK_MEMBERSHIPS.map((ms) => ({ ...ms }))
    this.messages = MOCK_MESSAGES.map((msg) => ({ ...msg }))
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private checkOneShot(method: string): Promise<never> | null {
    const err = this.oneShot.get(method)
    if (err) {
      this.oneShot.delete(method)
      return rejectChatError(err)
    }
    return null
  }

  private encodeCursor(id: string, serverCreatedAt: string): string {
    return btoa(`${id}:${serverCreatedAt}`)
  }

  private decodeCursor(cursor: string): { id: string; serverCreatedAt: string } {
    const raw = atob(cursor)
    const colonIdx = raw.indexOf(':')
    return {
      id: raw.slice(0, colonIdx),
      serverCreatedAt: raw.slice(colonIdx + 1),
    }
  }

  private paginateMessages(
    candidates: ChatMessage[],
    cursor: string | undefined,
    limit: number
  ): Page<ChatMessage> {
    // Sort DESC by serverCreatedAt for cursor application
    const sorted = [...candidates].sort(
      (a, b) =>
        new Date(b.serverCreatedAt).getTime() - new Date(a.serverCreatedAt).getTime()
    )

    let startIndex = 0
    if (cursor) {
      const { serverCreatedAt: cursorTs } = this.decodeCursor(cursor)
      // "before this serverCreatedAt" — find first item strictly older than cursor
      startIndex = sorted.findIndex(
        (m) => new Date(m.serverCreatedAt).getTime() < new Date(cursorTs).getTime()
      )
      if (startIndex === -1) {
        // No messages older than cursor
        return { items: [], nextCursor: null, prevCursor: null }
      }
    }

    const slice = sorted.slice(startIndex, startIndex + limit + 1)
    const hasMore = slice.length > limit
    const pageItems = hasMore ? slice.slice(0, limit) : slice

    // Return page in chronological order (oldest first)
    const chronological = [...pageItems].reverse()

    const nextCursor = hasMore
      ? this.encodeCursor(
          chronological[0].id,
          chronological[0].serverCreatedAt
        )
      : null

    return { items: chronological, nextCursor, prevCursor: null }
  }

  // ─── ChatRepository interface ─────────────────────────────────────────────

  async getCurrentUser(): Promise<ChatMember> {
    const err = this.checkOneShot('getCurrentUser')
    if (err) return err
    const member = this.members.find((m) => m.id === currentUserId)
    if (!member) throw makeChatError('UNAUTHENTICATED', 'Current user not found', false)
    return { ...member }
  }

  async listRooms(): Promise<ChatRoom[]> {
    const err = this.checkOneShot('listRooms')
    if (err) return err
    return this.rooms.map((r) => ({ ...r }))
  }

  async getRoom(roomId: RoomId): Promise<ChatRoom> {
    const err = this.checkOneShot('getRoom')
    if (err) return err
    const room = this.rooms.find((r) => r.id === roomId)
    if (!room) {
      throw makeChatError('ROOM_NOT_FOUND', `Room ${roomId} not found`, false)
    }
    return { ...room }
  }

  async listMemberships(roomId: RoomId): Promise<RoomMembership[]> {
    const err = this.checkOneShot('listMemberships')
    if (err) return err
    return this.memberships
      .filter((ms) => ms.roomId === roomId)
      .map((ms) => ({ ...ms }))
  }

  async listMessages(input: ListMessagesInput): Promise<Page<ChatMessage>> {
    const err = this.checkOneShot('listMessages')
    if (err) return err
    const { roomId, cursor, limit = 50 } = input
    const candidates = this.messages.filter(
      (m) => m.roomId === roomId && m.threadParentId === null
    )
    return this.paginateMessages(candidates, cursor, limit)
  }

  async listThreadReplies(
    parentId: MessageId,
    input?: { cursor?: string; limit?: number }
  ): Promise<Page<ChatMessage>> {
    const err = this.checkOneShot('listThreadReplies')
    if (err) return err
    const { cursor, limit = 50 } = input ?? {}
    const candidates = this.messages.filter(
      (m) => m.threadParentId === parentId
    )
    return this.paginateMessages(candidates, cursor, limit)
  }

  /**
   * Returns messages in roomId with serverCreatedAt strictly greater than `since`.
   * Inclusive lower bound: caller passes the last-known serverCreatedAt; this
   * method excludes that exact timestamp to avoid duplicates.
   */
  async listMessagesSince(roomId: RoomId, since: string): Promise<ChatMessage[]> {
    const err = this.checkOneShot('listMessagesSince')
    if (err) return err
    const sinceMs = new Date(since).getTime()
    return this.messages
      .filter(
        (m) =>
          m.roomId === roomId &&
          new Date(m.serverCreatedAt).getTime() > sinceMs
      )
      .sort(
        (a, b) =>
          new Date(a.serverCreatedAt).getTime() -
          new Date(b.serverCreatedAt).getTime()
      )
      .map((m) => ({ ...m }))
  }

  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    // Yield a macrotask so React can commit the optimistic insert (onMutate)
    // before this resolves and onSuccess swaps the pending row for the server
    // row. Without it, both setQueryData calls flush in one render and any
    // consumer keying off the optimistic id (e.g. scroll policy) misses it.
    await new Promise((resolve) => setTimeout(resolve, 0))

    const err = this.checkOneShot('sendMessage')
    if (err) return err

    const now = new Date().toISOString()
    const created: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      roomId: input.roomId,
      authorId: currentUserId,
      content: input.content,
      plainText: input.plainText,
      mentions: input.mentions,
      clientCreatedAt: input.clientCreatedAt,
      serverCreatedAt: now,
      editedAt: null,
      deletedAt: null,
      threadParentId: input.threadParentId ?? null,
      replyCount: 0,
      clientMsgId: input.clientMsgId,
      contentVersion: 1,
      version: 1,
      attachments: input.attachments && input.attachments.length > 0 ? input.attachments : undefined,
    }

    this.messages.push(created)

    // Update parent replyCount if this is a thread reply
    if (created.threadParentId) {
      const parent = this.messages.find((m) => m.id === created.threadParentId)
      if (parent) parent.replyCount += 1
    }

    // Update room lastMessageAt
    const room = this.rooms.find((r) => r.id === input.roomId)
    if (room) {
      room.lastMessageAt = now
      room.updatedAt = now
    }

    // Emit MESSAGE_CREATED via realtime after 600ms
    setTimeout(() => {
      this.bus.publish({ type: 'MESSAGE_CREATED', message: { ...created } })
    }, 600)

    return { ...created }
  }

  async createRoom(input: CreateRoomInput): Promise<ChatRoom> {
    const err = this.checkOneShot('createRoom')
    if (err) return err

    const name = `#${input.name.trim().toLowerCase().replace(/^#+/, '')}`
    if (this.rooms.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      throw makeChatError('CONFLICT', `Channel ${name} already exists`, false)
    }

    const now = new Date().toISOString()
    const room: ChatRoom = {
      id: `room-${crypto.randomUUID()}`,
      type: 'CHANNEL',
      name,
      description: input.description,
      memberCount: 1,
      unreadCount: 0,
      isFavorite: false,
      lastMessageAt: undefined,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.rooms.push(room)

    const ownerMembership: RoomMembership = {
      roomId: room.id,
      memberId: currentUserId,
      role: 'OWNER',
      joinedAt: now,
      lastReadAt: now,
      muted: false,
    }
    this.memberships.push(ownerMembership)

    // Reuses existing ChatRealtimeEvent variant — no new types
    this.bus.publish({ type: 'MEMBERSHIP_CHANGED', membership: ownerMembership })

    return { ...room }
  }

  async setRoomFavorite(roomId: RoomId, isFavorite: boolean): Promise<ChatRoom> {
    const err = this.checkOneShot('setRoomFavorite')
    if (err) return err
    const idx = this.rooms.findIndex((r) => r.id === roomId)
    if (idx < 0) {
      throw makeChatError('ROOM_NOT_FOUND', `Room ${roomId} not found`, false)
    }
    this.rooms[idx] = { ...this.rooms[idx], isFavorite }
    return { ...this.rooms[idx] }
  }

  async markRead(roomId: RoomId, lastReadAt: string): Promise<void> {
    const err = this.checkOneShot('markRead')
    if (err) return err
    const membership = this.memberships.find(
      (ms) => ms.roomId === roomId && ms.memberId === currentUserId
    )
    if (membership) {
      membership.lastReadAt = lastReadAt
    }
    // Emit ROOM_READ via bus so realtime subscribers can react
    this.bus.publish({
      type: 'ROOM_READ',
      roomId,
      memberId: currentUserId,
      lastReadAt,
    })
  }

  async addMembers(roomId: RoomId, memberIds: MemberId[]): Promise<RoomMembership[]> {
    const err = this.checkOneShot('addMembers')
    if (err) return err

    const callerMs = this.memberships.find(
      (ms) => ms.roomId === roomId && ms.memberId === currentUserId
    )
    if (!callerMs || (callerMs.role !== 'OWNER' && callerMs.role !== 'ADMIN')) {
      return Promise.reject(makeChatError('FORBIDDEN', 'Only OWNER or ADMIN can add members', false))
    }

    const now = new Date().toISOString()
    const added: RoomMembership[] = []

    for (const memberId of memberIds) {
      const alreadyMember = this.memberships.some(
        (ms) => ms.roomId === roomId && ms.memberId === memberId
      )
      if (alreadyMember) continue

      const membership: RoomMembership = {
        roomId,
        memberId,
        role: 'MEMBER',
        joinedAt: now,
        lastReadAt: null,
        muted: false,
      }
      this.memberships.push(membership)
      added.push(membership)

      const room = this.rooms.find((r) => r.id === roomId)
      if (room) {
        room.memberCount += 1
        room.updatedAt = now
      }
    }

    for (const membership of added) {
      this.bus.publish({ type: 'MEMBERSHIP_CHANGED', membership: { ...membership } })
    }

    return added.map((ms) => ({ ...ms }))
  }

  async deleteMessage(messageId: MessageId): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const err = this.checkOneShot('deleteMessage')
    if (err) return err
    const msg = this.messages.find((m) => m.id === messageId)
    if (!msg) {
      throw makeChatError('MESSAGE_NOT_FOUND', `Message ${messageId} not found`, false)
    }
    if (msg.authorId !== currentUserId) {
      const callerMs = this.memberships.find(
        (ms) => ms.roomId === msg.roomId && ms.memberId === currentUserId,
      )
      if (!callerMs || (callerMs.role !== 'OWNER' && callerMs.role !== 'ADMIN')) {
        return Promise.reject(
          makeChatError('FORBIDDEN', 'Only author or OWNER/ADMIN can delete a message', false),
        )
      }
    }
    const now = new Date().toISOString()
    msg.deletedAt = now
    msg.version += 1
    setTimeout(() => {
      this.bus.publish({
        type: 'MESSAGE_DELETED',
        messageId: msg.id,
        roomId: msg.roomId,
        deletedAt: now,
      })
    }, 100)
  }

  async addReaction(messageId: MessageId, emoji: string): Promise<ChatMessage> {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const err = this.checkOneShot('addReaction')
    if (err) return err
    return this.toggleReaction(messageId, emoji, 'add')
  }

  async removeReaction(messageId: MessageId, emoji: string): Promise<ChatMessage> {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const err = this.checkOneShot('removeReaction')
    if (err) return err
    return this.toggleReaction(messageId, emoji, 'remove')
  }

  private toggleReaction(
    messageId: MessageId,
    emoji: string,
    op: 'add' | 'remove',
  ): ChatMessage {
    const msg = this.messages.find((m) => m.id === messageId)
    if (!msg) throw makeChatError('MESSAGE_NOT_FOUND', `Message ${messageId} not found`, false)
    const current = msg.reactions ?? []
    const existing = current.find((r) => r.emoji === emoji)
    let next: typeof current
    if (op === 'add') {
      if (existing) {
        if (existing.userIds.includes(currentUserId)) {
          next = current
        } else {
          next = current.map((r) =>
            r.emoji === emoji ? { ...r, userIds: [...r.userIds, currentUserId] } : r,
          )
        }
      } else {
        next = [...current, { emoji, userIds: [currentUserId] }]
      }
    } else {
      if (!existing) {
        next = current
      } else {
        const filtered = existing.userIds.filter((id) => id !== currentUserId)
        if (filtered.length === 0) {
          next = current.filter((r) => r.emoji !== emoji)
        } else {
          next = current.map((r) =>
            r.emoji === emoji ? { ...r, userIds: filtered } : r,
          )
        }
      }
    }
    msg.reactions = next.length > 0 ? next : undefined
    msg.version += 1
    const updated = { ...msg, reactions: msg.reactions ? msg.reactions.map((r) => ({ ...r, userIds: [...r.userIds] })) : undefined }
    setTimeout(() => {
      this.bus.publish({ type: 'MESSAGE_UPDATED', message: { ...updated } })
    }, 100)
    return updated
  }

  async removeMember(roomId: RoomId, memberId: MemberId): Promise<void> {
    const err = this.checkOneShot('removeMember')
    if (err) return err

    const callerMs = this.memberships.find(
      (ms) => ms.roomId === roomId && ms.memberId === currentUserId
    )
    if (!callerMs || (callerMs.role !== 'OWNER' && callerMs.role !== 'ADMIN')) {
      return Promise.reject(makeChatError('FORBIDDEN', 'Only OWNER or ADMIN can remove members', false))
    }

    const idx = this.memberships.findIndex(
      (ms) => ms.roomId === roomId && ms.memberId === memberId
    )
    if (idx === -1) return

    const [removed] = this.memberships.splice(idx, 1)

    const now = new Date().toISOString()
    const room = this.rooms.find((r) => r.id === roomId)
    if (room) {
      room.memberCount = Math.max(0, room.memberCount - 1)
      room.updatedAt = now
    }

    this.bus.publish({ type: 'MEMBERSHIP_CHANGED', membership: { ...removed } })
  }

  // ─── Debug hooks ──────────────────────────────────────────────────────────

  /**
   * Next call to `methodName` will reject with a UNKNOWN ChatError.
   */
  __mockError(methodName: keyof ChatRepository): void {
    this.oneShot.set(
      methodName,
      makeChatError('UNKNOWN', `Mocked error on ${methodName}`, true)
    )
  }

  /**
   * FE-M2 virtualization spike: load 1,000+ mixed-height messages into a
   * synthetic `#heavy-load` room. Idempotent — repeat calls are no-ops.
   *
   * After mutation we synthesize a MEMBERSHIP_CHANGED event via the bus so
   * downstream React Query subscribers invalidate. Consumers who only watch
   * specific rooms miss this by design; the canonical trigger is URL flag
   * `?heavy=1` (see DataSourceProvider) which mounts the hook fresh.
   */
  __loadHeavyDataset(): void {
    if (this.rooms.some((r) => r.id === HEAVY_ROOM_ID)) return
    const heavyRoom: ChatRoom = { ...MOCK_ROOMS_HEAVY }
    const heavyMessages = generateHeavyMessages(HEAVY_ROOM_ID)
    this.rooms.push(heavyRoom)
    this.messages.push(...heavyMessages)
    // Give demo-user membership so useRoomMemberships returns something
    this.memberships.push({
      roomId: HEAVY_ROOM_ID,
      memberId: currentUserId,
      role: 'OWNER',
      joinedAt: heavyRoom.createdAt,
      lastReadAt: null,
      muted: false,
    })
    for (const member of this.members) {
      if (member.id === currentUserId) continue
      this.memberships.push({
        roomId: HEAVY_ROOM_ID,
        memberId: member.id,
        role: 'MEMBER',
        joinedAt: heavyRoom.createdAt,
        lastReadAt: null,
        muted: false,
      })
    }
    // Re-emit a synthetic membership event so active listeners refetch
    this.bus.publish({
      type: 'MEMBERSHIP_CHANGED',
      membership: {
        roomId: HEAVY_ROOM_ID,
        memberId: currentUserId,
        role: 'OWNER',
        joinedAt: heavyRoom.createdAt,
        lastReadAt: null,
        muted: false,
      },
    })
  }
}
