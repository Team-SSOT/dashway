import { Client, type StompSubscription } from '@stomp/stompjs'
import type { ChatRealtime, ChatRealtimeEvent, ConnectionState, MessageId, RoomId } from '@/types/chat'
import { toAuthorizationHeader } from '@/data/authHeader'

// Wire shape from BE: /topic/chat/rooms/{roomId}/messages
// BE wraps in { eventType: "MESSAGE_CREATED", message: { ... } }
interface WireMessagePayload {
  id: string
  roomId: string
  senderMemberId: number | string
  content: string
  createdDatetime: string
}

interface WireMessageFrame {
  eventType: string
  message: WireMessagePayload
}

export class LiveChatRealtime implements ChatRealtime {
  private client: Client
  private state: ConnectionState = 'disconnected'
  private connectionHandlers = new Set<(state: ConnectionState) => void>()
  private lastStompError: string | null = null

  constructor(private readonly getToken: () => string | null) {
    this.client = new Client({
      // Relative path → browser converts to absolute ws:// URL
      brokerURL: (() => {
        const wsUrl = import.meta.env.VITE_CHAT_WS_URL
        if (wsUrl) return wsUrl
        // Convert http(s):// origin to ws(s)://
        return new URL('/ws/chat', window.location.href).toString().replace(/^http/, 'ws')
      })(),

      // Fresh token on every (re)connect via beforeConnect
      beforeConnect: () => {
        this.client.connectHeaders = {
          Authorization: toAuthorizationHeader(this.getToken()),
        }
      },

      // heartbeatIncoming/Outgoing: 10000 (explicit; Spring broker default 0/0 but client-side explicit)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      reconnectDelay: 5000,

      onConnect: () => {
        this.lastStompError = null
        this.setState('connected')
      },

      onStompError: (frame) => {
        const msg = frame.headers['message'] ?? ''
        if (msg.includes('Unauthorized')) {
          this.lastStompError = 'Unauthorized'
          this.setState('disconnected')
          console.error('[LiveChatRealtime] STOMP ERROR Unauthorized', frame)
        }
      },

      onWebSocketClose: (evt) => {
        // JWT expiry re-auth: close code 1008 (policy violation) or preceded by Unauthorized STOMP error
        const code = (evt as CloseEvent).code
        if (code === 1008 || this.lastStompError === 'Unauthorized') {
          this.setState('disconnected')
          const freshToken = this.getToken()
          if (freshToken) {
            // Deactivate to clear internal state, then reactivate with fresh token
            void this.client.deactivate().then(() => {
              this.client.activate()
            })
          }
          return
        }
        this.setState('disconnected')
      },
    })

    this.client.activate()
  }

  private setState(next: ConnectionState) {
    if (this.state === next) return
    this.state = next
    for (const h of this.connectionHandlers) h(next)
  }

  /**
   * Token rotation trigger: called by DataSourceProvider when useAuthToken().version changes.
   * Sequence: client.deactivate() → getToken() re-read → client.activate()
   * This is the interlock path described in the plan (§3 Step 4 / team-exec.md interlock notes).
   */
  reactivateWithFreshToken(): void {
    void this.client.deactivate().then(() => {
      this.client.activate()
    })
  }

  watchRoom(roomId: RoomId, handler: (event: ChatRealtimeEvent) => void): () => void {
    let subscription: StompSubscription | null = null

    const frameHandler = (frame: { body: string }) => {
      try {
        const parsed = JSON.parse(frame.body) as WireMessageFrame
        if (parsed.eventType !== 'MESSAGE_CREATED') return
        const wire = parsed.message
        // Minimal ChatMessage shape for realtime echo; full history via ChatRepository
        const event: ChatRealtimeEvent = {
          type: 'MESSAGE_CREATED',
          message: {
            id: wire.id,
            roomId: wire.roomId,
            authorId: String(wire.senderMemberId),
            plainText: wire.content,
            // Lexical content: cast to avoid strict SerializedLexicalNode type (element vs leaf node split)
            content: {
              root: {
                children: [
                  {
                    children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: wire.content, type: 'text', version: 1 }],
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
            } as unknown as import('lexical').SerializedEditorState,
            clientCreatedAt: wire.createdDatetime,
            serverCreatedAt: wire.createdDatetime,
            editedAt: null,
            deletedAt: null,
            threadParentId: null,
            replyCount: 0,
            clientMsgId: '',
            contentVersion: 1,
            version: 1,
          },
        }
        handler(event)
      } catch (err) {
        console.error('[LiveChatRealtime] failed to parse frame', err)
      }
    }

    const doSubscribe = () => {
      if (this.client.connected && !subscription) {
        subscription = this.client.subscribe(
          `/topic/chat/rooms/${roomId}/messages`,
          frameHandler
        )
      }
    }

    // Subscribe immediately if already connected
    doSubscribe()

    // Re-subscribe on reconnect; clear subscription ref on disconnect.
    // Skip the immediate state emit from watchConnection (handled by doSubscribe above).
    let initialEmitDone = false
    const connectUnsub = this.watchConnection((state) => {
      if (!initialEmitDone) {
        initialEmitDone = true
        return
      }
      if (state === 'connected') {
        doSubscribe()
      } else if (state === 'disconnected') {
        // STOMP subscription is dead when disconnected; clear ref so re-subscribe works on reconnect
        subscription = null
      }
    })

    // Disposer: subscription.unsubscribe() only. Client.deactivate() is forbidden here —
    // Client lifecycle is owned by LiveChatRealtime constructor/destructor.
    return () => {
      connectUnsub()
      subscription?.unsubscribe()
      subscription = null
    }
  }

  watchThread(_parentId: MessageId, _handler: (event: ChatRealtimeEvent) => void): () => void {
    // no-op: thread realtime not supported in V1.1
    return () => {}
  }

  watchConnection(handler: (state: ConnectionState) => void): () => void {
    this.connectionHandlers.add(handler)
    // Emit current state immediately
    handler(this.state)
    return () => {
      this.connectionHandlers.delete(handler)
    }
  }

  /** Private helper used by LiveChatRepository.sendMessage delegation */
  sendMessageOverSocket(roomId: RoomId, content: string): void {
    this.client.publish({
      destination: `/app/chat/rooms/${roomId}/messages`,
      body: JSON.stringify({ content }),
      headers: { 'content-type': 'application/json' },
    })
  }

  destroy(): void {
    void this.client.deactivate()
  }
}
