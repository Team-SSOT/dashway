import { describe, it, expect } from 'vitest'
import { shouldForceScrollOnLocalSubmit } from '../messageListScrollPolicy'

describe('shouldForceScrollOnLocalSubmit', () => {
  it('returns false when pending → server-id swap (length unchanged, last key changes)', () => {
    const prevRows = [{ key: 'a' }, { key: 'pending-X' }]
    const nextRows = [{ key: 'a' }, { key: 'srv-Y' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(false)
  })

  it('returns true when empty → single pending-X append', () => {
    const prevRows: { key: string }[] = []
    const nextRows = [{ key: 'pending-X' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(true)
  })

  it('returns false when appending a non-pending remote message', () => {
    const prevRows = [{ key: 'a' }, { key: 'b' }]
    const nextRows = [{ key: 'a' }, { key: 'b' }, { key: 'remote-c' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(false)
  })

  it('returns false for identical arrays', () => {
    const rows = [{ key: 'a' }, { key: 'b' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows: rows, nextRows: rows })).toBe(false)
  })

  it('returns false when multiple rows appended at once (multi-row append)', () => {
    const prevRows = [{ key: 'a' }]
    const nextRows = [{ key: 'a' }, { key: 'pending-X' }, { key: 'pending-Y' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(false)
  })

  it('returns true for single pending-X appended to existing rows', () => {
    const prevRows = [{ key: 'a' }]
    const nextRows = [{ key: 'a' }, { key: 'pending-X' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(true)
  })

  it('returns true when a date divider is inserted alongside the pending row (cross-day submit)', () => {
    // Repro for the stale-mock-timestamp bug: the user's optimistic message
    // is on a different calendar day than the previous last message, so the
    // row builder inserts a DateDivider AND the pending row in the same render.
    const prevRows = [{ key: 'a' }]
    const nextRows = [{ key: 'a' }, { key: 'date-pending-X' }, { key: 'pending-X' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(true)
  })

  it('returns false when pending → server-id swap also drops a sibling divider', () => {
    // Sanity: a non-append row reshape with no NEW pending row must not fire.
    const prevRows = [{ key: 'a' }, { key: 'pending-X' }]
    const nextRows = [{ key: 'a' }, { key: 'date-srv-Y' }, { key: 'srv-Y' }]
    expect(shouldForceScrollOnLocalSubmit({ prevRows, nextRows })).toBe(false)
  })
})
