/**
 * Tests for MessageList force-scroll behaviour on local message submit.
 *
 * @tanstack/react-virtual is mocked so scrollToIndex is a spy we can assert on.
 * The virtualizer stub returns empty virtual items (no DOM layout needed).
 */
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChatMember, ChatMessage } from '@/types/chat'
import { simpleText } from '@/data/mockData'

// ─── Mock @tanstack/react-virtual ─────────────────────────────────────────────
const scrollToIndexSpy = vi.fn()

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: scrollToIndexSpy,
    measureElement: () => 0,
  }),
}))

// Import AFTER mock registration
import { MessageList } from '../MessageList'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MEMBER: ChatMember = { id: 'u1', name: 'Alice' }

function makeMsg(id: string, threadParentId: string | null = null): ChatMessage {
  const now = new Date().toISOString()
  return {
    id,
    roomId: 'room-1',
    authorId: 'u1',
    content: simpleText('hello'),
    plainText: 'hello',
    clientCreatedAt: now,
    serverCreatedAt: now,
    editedAt: null,
    deletedAt: null,
    threadParentId,
    replyCount: 0,
    clientMsgId: `cmid-${id}`,
    contentVersion: 1,
    version: 0,
  }
}

function renderList(messages: ChatMessage[]) {
  return render(
    <MessageList
      roomId="room-1"
      flatMessages={messages}
      members={[MEMBER]}
      lastReadAt={null}
    />,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MessageList scroll-on-submit', () => {
  beforeEach(() => {
    scrollToIndexSpy.mockClear()
  })

  it('AC1: scrolled-up + append pending row → scrollToIndex called', () => {
    const msgs = [makeMsg('msg-a')]
    const { rerender, container } = renderList(msgs)

    // Simulate scrolled-up state via onScroll handler
    const scrollEl = container.querySelector('[role="log"]') as HTMLElement
    Object.defineProperty(scrollEl, 'scrollHeight', { value: 5000, configurable: true })
    Object.defineProperty(scrollEl, 'clientHeight', { value: 500, configurable: true })
    fireEvent.scroll(scrollEl, { target: { scrollTop: 0 } })

    // scrollToIndex was called on first mount — reset after setting up scroll state
    scrollToIndexSpy.mockClear()

    // Append optimistic (pending) message
    rerender(
      <MessageList
        roomId="room-1"
        flatMessages={[...msgs, makeMsg('pending-xyz')]}
        members={[MEMBER]}
        lastReadAt={null}
      />,
    )

    expect(scrollToIndexSpy).toHaveBeenCalledTimes(1)
    expect(scrollToIndexSpy).toHaveBeenCalledWith(expect.any(Number), { align: 'end' })
  })

  it('AC2: scrolled-up + append non-pending row → scrollToIndex NOT called', () => {
    const msgs = [makeMsg('msg-a')]
    const { rerender, container } = renderList(msgs)

    const scrollEl = container.querySelector('[role="log"]') as HTMLElement
    Object.defineProperty(scrollEl, 'scrollHeight', { value: 5000, configurable: true })
    Object.defineProperty(scrollEl, 'clientHeight', { value: 500, configurable: true })
    fireEvent.scroll(scrollEl, { target: { scrollTop: 0 } })

    scrollToIndexSpy.mockClear()

    // Append a remote (non-pending) message
    rerender(
      <MessageList
        roomId="room-1"
        flatMessages={[...msgs, makeMsg('remote-msg-b')]}
        members={[MEMBER]}
        lastReadAt={null}
      />,
    )

    expect(scrollToIndexSpy).toHaveBeenCalledTimes(0)
  })

  it('AC3: at-bottom + append pending row → scrollToIndex called exactly once', () => {
    const msgs = [makeMsg('msg-a')]
    const { rerender } = renderList(msgs)

    // Don't override scroll metrics — stays at-bottom by default (isAtBottom starts true)
    scrollToIndexSpy.mockClear()

    rerender(
      <MessageList
        roomId="room-1"
        flatMessages={[...msgs, makeMsg('pending-xyz')]}
        members={[MEMBER]}
        lastReadAt={null}
      />,
    )

    // Force-scroll branch fires (returns early), so exactly once, not double
    expect(scrollToIndexSpy).toHaveBeenCalledTimes(1)
  })

  it('AC6: key change (room switch) does not carry over scrollToIndex from prior state', () => {
    const msgs = [makeMsg('msg-a')]
    const { rerender } = render(
      <MessageList
        key="roomA"
        roomId="room-A"
        flatMessages={msgs}
        members={[MEMBER]}
        lastReadAt={null}
      />,
    )

    scrollToIndexSpy.mockClear()

    // Re-render with a different key — React fully unmounts and remounts MessageList
    rerender(
      <MessageList
        key="roomB"
        roomId="room-B"
        flatMessages={[makeMsg('msg-b')]}
        members={[MEMBER]}
        lastReadAt={null}
      />,
    )

    // After remount, only first-mount scroll fires (which is 1 call for the new room)
    // The important thing: the prior room's state does NOT trigger additional spurious calls
    expect(scrollToIndexSpy).toHaveBeenCalledTimes(1)
  })
})
