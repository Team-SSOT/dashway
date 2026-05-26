/**
 * SSOT for FE/BE contract. See .omc/plans/chat-frontend-ui-v1.md §6. Changes here require BE notification.
 */

import type { RichTextMention } from '@dashway/app-protocol'
import type { SerializedEditorState } from 'lexical'

// §6.1 Type aliases
export type MemberId = string
export type RoomId = string
export type MessageId = string
export type ClientMsgId = string  // client-generated (uuid v7)
export type Cursor = string       // opaque, server-encoded (base64(lastId+ts))

// 사용자
export interface ChatMember {
  id: MemberId
  name: string
  avatarUrl?: string
}

// 룸 멤버십 (멤버-룸 N:M, 역할 포함)
// FE viewmodel labels including ADMIN/GUEST (mock-only). BE enum: OWNER|MEMBER (chat.graphqls:32-35).
export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
export interface RoomMembership {
  roomId: RoomId
  memberId: MemberId
  role: RoomRole
  joinedAt: string          // ISO
  lastReadAt: string | null // ISO, null이면 전체 언리드
  muted: boolean
}

// 룸
// FE viewmodel labels. Wire boundary: see wire/adapters.ts. BE enum: DIRECT|GROUP.
export type RoomType = 'CHANNEL' | 'DM'
export interface ChatRoom {
  id: RoomId
  type: RoomType
  name: string
  description?: string
  topic?: string
  memberCount: number       // 서버 제공 (멤버십 조회 분리)
  unreadCount: number       // 현재 사용자 기준 (서버 계산)
  isFavorite: boolean       // BE chatRooms 응답에서 전달, setChatRoomFavorite mutation으로 토글 (V1.2 BE 작업)
  lastMessageAt?: string
  // FE-only metadata; populated by adapter for DIRECT rooms (first non-self member).
  peerMemberId?: MemberId   // For DM rooms — references the other party's MemberId. FE-only field; BE notification when DM protocol lands.
  createdAt: string
  updatedAt: string
  version: number           // optimistic concurrency (v2 edit용)
}

// 첨부 파일 — mock에서는 blob: URL을 url로 사용 (세션 한정 수명)
export interface MessageAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  url?: string  // image/* 외에는 미리보기 URL 없을 수 있음
}

// 리액션 — viewer-agnostic. Per-viewer count/reactedByMe는 selector에서 파생.
// BE notification: 실제 서버 도입 시 wire shape는 그대로 유지하고
// addReaction/removeReaction을 HTTP로만 교체할 것.
export interface Reaction {
  emoji: string
  userIds: MemberId[]
}

// 메시지 — server/client 타임스탬프 분리
export interface ChatMessage {
  id: MessageId
  roomId: RoomId
  authorId: MemberId
  content: SerializedEditorState  // Lexical JSON, contentVersion=1
  plainText: string                // 서버 파생 (검색·프리뷰용)
  mentions?: RichTextMention[]     // shared body mentions; see @dashway/app-protocol
  clientCreatedAt: string          // 클라이언트 전송 시각 (낙관적 UI 정렬용)
  serverCreatedAt: string          // 서버 확정 시각 (정식 순서)
  editedAt: string | null
  deletedAt: string | null         // soft delete
  threadParentId: MessageId | null
  replyCount: number
  clientMsgId: ClientMsgId         // 송신 dedup 키, UNIQUE(roomId, clientMsgId)
  contentVersion: 1                // 포맷 버전 (드리프트 대비)
  version: number                  // optimistic concurrency
  attachments?: MessageAttachment[]
  reactions?: Reaction[]
}

// 페이징 — 불투명 cursor (ID/시간 노출 금지)
export interface Page<T> {
  items: T[]
  nextCursor: Cursor | null  // null이면 더 없음
  prevCursor: Cursor | null  // prepend용
}

// 도메인 에러 타입 (typed, throw/return 전부 이걸로 통일)
export type ChatErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ROOM_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION'
  | 'CONFLICT'        // version mismatch
  | 'NETWORK'         // transport failure
  | 'UNKNOWN'

export interface ChatError {
  code: ChatErrorCode
  message: string
  retriable: boolean
  cause?: unknown
}

// §6.2 ChatRepository — REST 상응 (요청/응답)
export interface ListMessagesInput {
  roomId: RoomId
  cursor?: Cursor          // before-cursor (오래된 방향 페이징)
  limit?: number           // default 50, max 200
}

export interface SendMessageInput {
  roomId: RoomId
  content: SerializedEditorState
  plainText: string        // 클라가 walker로 파생
  mentions: RichTextMention[]
  clientMsgId: ClientMsgId
  threadParentId?: MessageId
  clientCreatedAt: string  // ISO, 클라 시계
  attachments?: MessageAttachment[]
}

// §6.2 Create-room input (addchannel scope extension)
// BE: POST /api/rooms  — see .omc/handoff/chat-frontend-ui-v1-be-spec.md §3
export interface CreateRoomInput {
  name: string         // raw user input; server normalizes
  description?: string // reserved — v1 FE omits, but type accepts
}

export interface ChatRepository {
  getCurrentUser(): Promise<ChatMember>

  listRooms(): Promise<ChatRoom[]>
  getRoom(roomId: RoomId): Promise<ChatRoom>
  listMemberships(roomId: RoomId): Promise<RoomMembership[]>  // 멤버 패널용

  listMessages(input: ListMessagesInput): Promise<Page<ChatMessage>>
  listThreadReplies(parentId: MessageId, input?: { cursor?: Cursor; limit?: number }): Promise<Page<ChatMessage>>
  listMessagesSince(roomId: RoomId, since: string): Promise<ChatMessage[]>  // 재연결 catch-up

  sendMessage(input: SendMessageInput): Promise<ChatMessage>
  markRead(roomId: RoomId, lastReadAt: string): Promise<void>
  createRoom(input: CreateRoomInput): Promise<ChatRoom>

  // Toggle per-user favorite mark on a room. Live mode requires the V1.2
  // setChatRoomFavorite mutation; until it lands, live calls will reject with
  // a 'not implemented' error and the optimistic UI must roll back.
  setRoomFavorite(roomId: RoomId, isFavorite: boolean): Promise<ChatRoom>

  // Idempotent toggle: 같은 (messageId, emoji, userId) 조합으로 중복 호출해도 한 번만 반영.
  // BE notification required when implementing real transport.
  addReaction(messageId: MessageId, emoji: string): Promise<ChatMessage>
  removeReaction(messageId: MessageId, emoji: string): Promise<ChatMessage>

  // Soft delete: deletedAt 설정. authorId !== currentUser AND role ∉ {OWNER, ADMIN}이면 FORBIDDEN.
  // BE notification required when implementing real transport.
  deleteMessage(messageId: MessageId): Promise<void>

  // BE notification required when implementing real transport
  addMembers(roomId: RoomId, memberIds: MemberId[]): Promise<RoomMembership[]>
  removeMember(roomId: RoomId, memberId: MemberId): Promise<void>
}

// §6.3 ChatRealtime — WS/STOMP 상응 (scoped watcher + connection state)
export type ChatRealtimeEvent =
  | { type: 'MESSAGE_CREATED'; message: ChatMessage }
  | { type: 'MESSAGE_UPDATED'; message: ChatMessage }
  | { type: 'MESSAGE_DELETED'; messageId: MessageId; roomId: RoomId; deletedAt: string }
  | { type: 'ROOM_READ'; roomId: RoomId; memberId: MemberId; lastReadAt: string }
  | { type: 'MEMBERSHIP_CHANGED'; membership: RoomMembership }

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface ChatRealtime {
  // 룸 스코프 구독 (STOMP destination /topic/rooms/{roomId}에 매핑)
  watchRoom(roomId: RoomId, handler: (event: ChatRealtimeEvent) => void): () => void

  // 스레드 스코프 구독 (내부적으로 watchRoom 필터링 or 별도 destination)
  watchThread(parentId: MessageId, handler: (event: ChatRealtimeEvent) => void): () => void

  // 연결 상태 이벤트 (UI에서 "연결 복구 중..." 배너, 재연결 후 catch-up 트리거)
  watchConnection(handler: (state: ConnectionState) => void): () => void

  // 재연결 후 유실 메시지 보정은 hook이 이 이벤트를 받고 ChatRepository.listMessagesSince()를 호출
  //   → ChatRealtime은 transport만, catch-up 로직은 hook에 위치
}
