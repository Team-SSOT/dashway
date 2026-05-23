import { GraphQLClient } from 'graphql-request'
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
import type { LiveChatRealtime } from '@/data/LiveChatRealtime'
import {
  adaptChatRoom,
  adaptChatRoomPage,
  adaptMemberships,
  type WireChatRoomsResponse,
  type WireRoom,
} from '@/data/wire/adapters'

function makeChatError(code: ChatError['code'], message: string, retriable: boolean): ChatError {
  return { code, message, retriable }
}

function rejectChatError(error: ChatError): Promise<never> {
  return Promise.reject(error)
}

function notSupported(method: string): Promise<never> {
  return rejectChatError(makeChatError('UNKNOWN', `V1: ${method} not supported`, false))
}

// GraphQL query strings (hand-written; codegen types used when available)
const CHAT_ROOMS_QUERY = /* GraphQL */ `
  query chatRooms($input: ChatRoomsInput!) {
    chatRooms(input: $input) {
      rooms {
        id type isPublic title isFavorite canDelete memberCount
        members { memberId role joinedDatetime }
        createdDatetime updatedDatetime
      }
      pageInfo { page size totalElements totalPages }
    }
  }
`

const CREATE_CHAT_ROOM_MUTATION = /* GraphQL */ `
  mutation createChatRoom($input: CreateChatRoomInput!) {
    createChatRoom(input: $input) {
      id type isPublic title isFavorite canDelete memberCount
      members { memberId role joinedDatetime }
      createdDatetime updatedDatetime
    }
  }
`

const SET_CHAT_ROOM_FAVORITE_MUTATION = /* GraphQL */ `
  mutation setChatRoomFavorite($input: SetChatRoomFavoriteInput!) {
    setChatRoomFavorite(input: $input) {
      id type isPublic title isFavorite canDelete memberCount
      members { memberId role joinedDatetime }
      createdDatetime updatedDatetime
    }
  }
`

export class LiveChatRepository implements ChatRepository {
  private gql: GraphQLClient
  private roomsCache: WireRoom[] | null = null

  constructor(
    private readonly realtime: LiveChatRealtime,
    private readonly getToken: () => string | null,
    private readonly getMemberId: () => string | null,
    private readonly onSessionInvalid?: () => void
  ) {
    const endpoint = import.meta.env.VITE_CHAT_GRAPHQL_URL ?? new URL('/graphql', window.location.origin).toString()
    this.gql = new GraphQLClient(
      endpoint,
      {
        requestMiddleware: (req) => ({
          ...req,
          headers: {
            ...req.headers,
            'Content-Type': 'application/json',
            Authorization: this.getToken() ?? '',
          },
        }),
      }
    )
  }

  private async mapGraphQLError(err: unknown): Promise<never> {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('UNAUTHENTICATED')) {
      this.onSessionInvalid?.()
      return rejectChatError(makeChatError('UNAUTHENTICATED', message, false))
    }
    if (message.includes('403') || message.includes('Forbidden') || message.includes('FORBIDDEN')) {
      return rejectChatError(makeChatError('FORBIDDEN', message, false))
    }
    return rejectChatError(makeChatError('UNKNOWN', message, true))
  }

  async getCurrentUser(): Promise<ChatMember> {
    // V1.1: no getCurrentUser GraphQL op on BE. memberId is parsed from JWT
    // by AuthProvider; pass it through here so optimistic rows carry the
    // real authorId and consecutive-author grouping doesn't flicker on
    // BE-echo replacement.
    const id = this.getMemberId() ?? '0'
    return { id, name: '', avatarUrl: undefined }
  }

  async listRooms(): Promise<ChatRoom[]> {
    try {
      const data = await this.gql.request<{ chatRooms: WireChatRoomsResponse }>(
        CHAT_ROOMS_QUERY,
        { input: { page: 0, size: 100, favoriteOnly: null } }
      )
      this.roomsCache = data.chatRooms.rooms
      const page = adaptChatRoomPage(data.chatRooms)
      return page.items
    } catch (err) {
      return this.mapGraphQLError(err)
    }
  }

  private async getCachedRooms(): Promise<WireRoom[]> {
    if (this.roomsCache !== null) return this.roomsCache
    await this.listRooms()
    return this.roomsCache ?? []
  }

  async getRoom(roomId: RoomId): Promise<ChatRoom> {
    const rooms = await this.getCachedRooms()
    const wire = rooms.find((r) => r.id === roomId)
    if (!wire) {
      return rejectChatError(makeChatError('ROOM_NOT_FOUND', `Room ${roomId} not found`, false))
    }
    return adaptChatRoom(wire)
  }

  async listMemberships(roomId: RoomId): Promise<RoomMembership[]> {
    const rooms = await this.getCachedRooms()
    const wire = rooms.find((r) => r.id === roomId)
    if (!wire) return []
    return adaptMemberships(wire)
  }

  async createRoom(input: CreateRoomInput): Promise<ChatRoom> {
    try {
      const data = await this.gql.request<{ createChatRoom: WireRoom }>(
        CREATE_CHAT_ROOM_MUTATION,
        {
          input: {
            type: 'GROUP',
            isPublic: false,
            title: input.name,
            participantMemberIds: [],
          },
        }
      )
      const room = adaptChatRoom(data.createChatRoom)
      // Invalidate cache so next listRooms() fetches fresh
      this.roomsCache = null
      return room
    } catch (err) {
      return this.mapGraphQLError(err)
    }
  }

  sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    // Delegates to STOMP; optimistic row built here
    this.realtime.sendMessageOverSocket(input.roomId, input.plainText)
    const optimistic: ChatMessage = {
      id: input.clientMsgId,
      roomId: input.roomId,
      authorId: this.getMemberId() ?? '0',
      content: input.content,
      plainText: input.plainText,
      clientCreatedAt: input.clientCreatedAt,
      serverCreatedAt: input.clientCreatedAt,
      editedAt: null,
      deletedAt: null,
      threadParentId: input.threadParentId ?? null,
      replyCount: 0,
      clientMsgId: input.clientMsgId,
      contentVersion: 1,
      version: 1,
      attachments: input.attachments,
    }
    return Promise.resolve(optimistic)
  }

  async setRoomFavorite(roomId: RoomId, isFavorite: boolean): Promise<ChatRoom> {
    try {
      const data = await this.gql.request<{ setChatRoomFavorite: WireRoom }>(
        SET_CHAT_ROOM_FAVORITE_MUTATION,
        { input: { roomId, isFavorite } }
      )
      const room = adaptChatRoom(data.setChatRoomFavorite)
      this.roomsCache = null
      return room
    } catch (err) {
      return this.mapGraphQLError(err)
    }
  }

  listMessages(_input: ListMessagesInput): Promise<Page<ChatMessage>> {
    return notSupported('listMessages')
  }

  listThreadReplies(_parentId: MessageId): Promise<Page<ChatMessage>> {
    return notSupported('listThreadReplies')
  }

  listMessagesSince(_roomId: RoomId, _since: string): Promise<ChatMessage[]> {
    return notSupported('listMessagesSince')
  }

  markRead(_roomId: RoomId, _lastReadAt: string): Promise<void> {
    return notSupported('markRead')
  }

  addReaction(_messageId: MessageId, _emoji: string): Promise<ChatMessage> {
    return notSupported('addReaction')
  }

  removeReaction(_messageId: MessageId, _emoji: string): Promise<ChatMessage> {
    return notSupported('removeReaction')
  }

  deleteMessage(_messageId: MessageId): Promise<void> {
    return notSupported('deleteMessage')
  }

  addMembers(_roomId: RoomId, _memberIds: MemberId[]): Promise<RoomMembership[]> {
    return notSupported('addMembers')
  }

  removeMember(_roomId: RoomId, _memberId: MemberId): Promise<void> {
    return notSupported('removeMember')
  }
}
