import type { ChatRealtime, ChatRealtimeEvent, ConnectionState, MessageId, RoomId } from '@/types/chat'
import type { MockEventBus } from '@/data/mockEventBus'

export class MockChatRealtime implements ChatRealtime {
  private connectionHandlers = new Set<(state: ConnectionState) => void>()

  constructor(private readonly bus: MockEventBus) {}

  watchRoom(roomId: RoomId, handler: (event: ChatRealtimeEvent) => void): () => void {
    return this.bus.subscribe((event) => {
      // Thread replies are scoped to watchThread — they must NOT cross-pollute
      // the main room message cache via watchRoom subscribers.
      if (
        event.type === 'MESSAGE_CREATED' &&
        event.message.roomId === roomId &&
        event.message.threadParentId === null
      ) {
        handler(event)
      } else if (
        event.type === 'MESSAGE_UPDATED' &&
        event.message.roomId === roomId &&
        event.message.threadParentId === null
      ) {
        handler(event)
      } else if (event.type === 'MESSAGE_DELETED' && event.roomId === roomId) {
        handler(event)
      } else if (event.type === 'ROOM_READ' && event.roomId === roomId) {
        handler(event)
      } else if (event.type === 'MEMBERSHIP_CHANGED' && event.membership.roomId === roomId) {
        handler(event)
      }
    })
  }

  watchThread(parentId: MessageId, handler: (event: ChatRealtimeEvent) => void): () => void {
    return this.bus.subscribe((event) => {
      if (
        event.type === 'MESSAGE_CREATED' &&
        event.message.threadParentId === parentId
      ) {
        handler(event)
      } else if (
        event.type === 'MESSAGE_UPDATED' &&
        event.message.threadParentId === parentId
      ) {
        handler(event)
      }
    })
  }

  watchConnection(handler: (state: ConnectionState) => void): () => void {
    this.connectionHandlers.add(handler)
    // Synchronously fire 'connecting', then 'connected' after 200ms
    handler('connecting')
    const timerId = setTimeout(() => {
      handler('connected')
    }, 200)

    return () => {
      clearTimeout(timerId)
      this.connectionHandlers.delete(handler)
    }
  }

  /**
   * Debug hook: simulates a disconnection, then auto-reconnects after 2s.
   */
  __mockDisconnect(): void {
    for (const h of this.connectionHandlers) {
      h('disconnected')
    }
    setTimeout(() => {
      for (const h of this.connectionHandlers) {
        h('reconnecting')
      }
      setTimeout(() => {
        for (const h of this.connectionHandlers) {
          h('connected')
        }
      }, 2000)
    }, 0)
  }
}
