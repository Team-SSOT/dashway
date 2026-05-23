/**
 * Simple EventTarget-backed pub/sub for mock data coupling.
 * Both MockChatRepository and MockChatRealtime use this singleton.
 */

import type { ChatRealtimeEvent } from '@/types/chat'

type EventBusHandler = (event: ChatRealtimeEvent) => void

class MockEventBus {
  private target = new EventTarget()

  publish(event: ChatRealtimeEvent): void {
    this.target.dispatchEvent(
      new CustomEvent('chat', { detail: event })
    )
  }

  subscribe(handler: EventBusHandler): () => void {
    const listener = (e: Event) => {
      handler((e as CustomEvent<ChatRealtimeEvent>).detail)
    }
    this.target.addEventListener('chat', listener)
    return () => this.target.removeEventListener('chat', listener)
  }
}

export const eventBus = new MockEventBus()
export type { MockEventBus }
