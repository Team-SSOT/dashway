import type { MentionTarget } from '@dashway/rich-text'
import type { SerializedEditorState } from 'lexical'
import type {
  ChatError,
  ChatMessage,
  ChatRoom,
  ContentMention,
  Page,
  RoomMembership,
} from '@/types/chat'

// Wire types from BE (mirrors chat.graphqls). Long fields are string (codegen scalars config).
export interface WireRoomMember {
  memberId: string
  role: 'OWNER' | 'MEMBER'
  joinedDatetime: string
}

export interface WireRoom {
  id: string
  type: 'DIRECT' | 'GROUP'
  isPublic: boolean
  title: string | null
  isFavorite: boolean
  canDelete: boolean
  memberCount: number
  members: WireRoomMember[]
  createdDatetime: string
  updatedDatetime: string
}

export interface WirePageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface WireChatRoomsResponse {
  rooms: WireRoom[]
  pageInfo: WirePageInfo
}

export interface WireMessage {
  id: string | number
  roomId: string
  memberId: string | number
  clientMessageId: string
  content: string | null
  mentions: ContentMention[]
  isDeleted: boolean
  createdDatetime: string
  editedDatetime: string | null
  deletedDatetime: string | null
}

function makeChatError(code: ChatError['code'], message: string, retriable: boolean): ChatError {
  return { code, message, retriable }
}

/** Asserts wire memberId is a string. BE maps Long → String via codegen scalar. */
export function assertWireMemberId(x: unknown): asserts x is string {
  if (typeof x !== 'string') {
    throw makeChatError(
      'VALIDATION',
      `assertWireMemberId: expected string, got ${typeof x} (${String(x)})`,
      false,
    )
  }
}

export function adaptChatRoomMember(wire: WireRoomMember): RoomMembership & { _roomId?: string } {
  assertWireMemberId(wire.memberId)
  return {
    roomId: '',
    memberId: wire.memberId,
    // BE enum: OWNER|MEMBER. FE viewmodel includes ADMIN|GUEST (mock-only).
    role: wire.role,
    joinedAt: wire.joinedDatetime,
    lastReadAt: null,
    muted: false,
  }
}

export function adaptChatRoom(wire: WireRoom, currentMemberId?: string): ChatRoom {
  const isDirect = wire.type === 'DIRECT'
  const peerMember = isDirect
    ? (wire.members.find((m) => m.memberId !== currentMemberId) ?? wire.members[0])
    : undefined

  return {
    id: wire.id,
    // BE enum: DIRECT→DM, GROUP→CHANNEL
    type: isDirect ? 'DM' : 'CHANNEL',
    name: wire.title ?? peerMember?.memberId ?? '',
    description: undefined,
    topic: undefined,
    memberCount: wire.memberCount,
    unreadCount: 0,
    isFavorite: wire.isFavorite,
    lastMessageAt: undefined,
    peerMemberId: isDirect ? peerMember?.memberId : undefined,
    createdAt: wire.createdDatetime,
    updatedAt: wire.updatedDatetime,
    version: 1,
  }
}

export function adaptChatRoomPage(
  wire: WireChatRoomsResponse,
  currentMemberId?: string,
): Page<ChatRoom> {
  return {
    items: wire.rooms.map((r) => adaptChatRoom(r, currentMemberId)),
    nextCursor: null,
    prevCursor: null,
  }
}

export function adaptMemberships(wire: WireRoom): RoomMembership[] {
  return wire.members.map((m) => ({
    ...adaptChatRoomMember(m),
    roomId: wire.id,
  }))
}

export function plainTextToLexicalContent(text: string): SerializedEditorState {
  return {
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as SerializedEditorState
}

export function adaptChatMessage(wire: WireMessage): ChatMessage {
  const plainText = wire.isDeleted ? '' : (wire.content ?? '')
  return {
    id: String(wire.id),
    roomId: wire.roomId,
    authorId: String(wire.memberId),
    content: plainTextToLexicalContent(plainText),
    plainText,
    clientCreatedAt: wire.createdDatetime,
    serverCreatedAt: wire.createdDatetime,
    editedAt: wire.editedDatetime,
    deletedAt: wire.isDeleted
      ? (wire.deletedDatetime ?? wire.editedDatetime ?? wire.createdDatetime)
      : null,
    threadParentId: null,
    replyCount: 0,
    clientMsgId: wire.clientMessageId,
    contentVersion: 1,
    version: 1,
    mentions: wire.mentions,
  }
}

const PERSON_MENTION_APP_ID = 'context'

export function toContentMentions(targets: MentionTarget[]): ContentMention[] {
  return targets.flatMap((target) => {
    if (target.type === 'person') {
      return [{ appId: PERSON_MENTION_APP_ID, memberId: target.id }]
    }
    return []
  })
}
