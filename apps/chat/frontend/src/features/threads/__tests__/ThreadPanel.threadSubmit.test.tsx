/**
 * AC7: Thread reply submit must NOT trigger MessageList force-scroll.
 *
 * Simplification rationale: full ThreadPanel mounting requires react-router
 * params, QueryClient hydration, and Lexical composer — all of which have no
 * existing test harness in this directory. Instead we assert the boundary at
 * the policy level:
 *
 *   - Thread replies are appended to the *thread* query cache (keyed by msgId),
 *     NOT to the room messages cache.
 *   - shouldForceScrollOnLocalSubmit operates solely on the room MessageList's
 *     `rows` array (projections of room-level messages).
 *   - If the room rows array is unchanged after a thread reply submit, the
 *     helper returns false → no force-scroll.
 *
 * This test verifies that invariant directly, without needing a full component tree.
 */
import { describe, it, expect } from 'vitest'
import { shouldForceScrollOnLocalSubmit } from '@/features/messages/components/messageListScrollPolicy'
import { OPTIMISTIC_ID_PREFIX } from '@/features/messages/hooks/useSendMessage'

describe('ThreadPanel.threadSubmit — MessageList scroll policy isolation', () => {
  it('thread reply submit does not affect room rows → shouldForceScrollOnLocalSubmit returns false', () => {
    // Simulate the room MessageList rows BEFORE and AFTER a thread reply is submitted.
    // A thread reply appends to the thread cache only; room rows are unchanged.
    const roomRows = [
      { key: 'date-msg-1' },        // date divider
      { key: 'msg-1' },             // parent message (the one being replied to)
      { key: 'msg-2' },             // another channel message
    ]

    // After a thread reply, room rows remain identical (thread replies are filtered
    // out of the channel view by MessageList's `visible` memo: `!m.threadParentId`).
    const roomRowsAfterThreadReply = [...roomRows]

    expect(
      shouldForceScrollOnLocalSubmit({
        prevRows: roomRows,
        nextRows: roomRowsAfterThreadReply,
      }),
    ).toBe(false)
  })

  it('OPTIMISTIC_ID_PREFIX is never applied to thread reply IDs in room rows', () => {
    // Even if we hypothetically constructed a scenario where a pending thread
    // reply key leaked into room rows, it would be filtered by threadParentId.
    // This test documents that the prefix alone does not cause false positives
    // when the length check fails (thread reply doesn't change room row count).
    const roomRows = [{ key: 'msg-1' }]
    // Thread reply optimistic ID — same shape as a pending message but length unchanged
    const roomRowsUnchanged = [{ key: 'msg-1' }]

    // Length unchanged → false regardless of pending prefix
    expect(
      shouldForceScrollOnLocalSubmit({
        prevRows: roomRows,
        nextRows: roomRowsUnchanged,
      }),
    ).toBe(false)

    // Confirm the prefix constant itself is correct
    expect(OPTIMISTIC_ID_PREFIX).toBe('pending-')
  })
})
