import { describe, it, expect } from 'vitest'
import type { Reaction } from '@/types/chat'
import { __test__ } from '../useToggleReaction'

const { applyToggle } = __test__

// currentUserId is 'demo-user' per mockData.ts:257.
const ME = 'demo-user'

describe('applyToggle (optimistic reducer)', () => {
  it('adds a fresh emoji when none exist', () => {
    const out = applyToggle(undefined, '👍', false)
    expect(out).toEqual([{ emoji: '👍', userIds: [ME] }])
  })

  it('appends current user to an existing emoji entry', () => {
    const prev: Reaction[] = [{ emoji: '👍', userIds: ['alice'] }]
    const out = applyToggle(prev, '👍', false)
    expect(out).toEqual([{ emoji: '👍', userIds: ['alice', ME] }])
  })

  it('idempotent on add: adding when current user already present is a no-op', () => {
    const prev: Reaction[] = [{ emoji: '👍', userIds: [ME, 'alice'] }]
    const out = applyToggle(prev, '👍', false)
    expect(out).toEqual(prev)
  })

  it('removes current user from a multi-user reaction', () => {
    const prev: Reaction[] = [{ emoji: '👍', userIds: [ME, 'alice'] }]
    const out = applyToggle(prev, '👍', true)
    expect(out).toEqual([{ emoji: '👍', userIds: ['alice'] }])
  })

  it('drops the reaction entry entirely when the last user is removed', () => {
    const prev: Reaction[] = [{ emoji: '👍', userIds: [ME] }]
    const out = applyToggle(prev, '👍', true)
    expect(out).toBeUndefined()
  })

  it('preserves other emojis when toggling one', () => {
    const prev: Reaction[] = [
      { emoji: '👍', userIds: [ME] },
      { emoji: '🎉', userIds: ['alice'] },
    ]
    const out = applyToggle(prev, '👍', true)
    expect(out).toEqual([{ emoji: '🎉', userIds: ['alice'] }])
  })

  it('returns undefined for empty input on a remove no-op', () => {
    const out = applyToggle(undefined, '👍', true)
    expect(out).toBeUndefined()
  })
})
