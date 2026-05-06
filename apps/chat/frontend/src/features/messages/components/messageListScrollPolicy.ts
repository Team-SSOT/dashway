import { OPTIMISTIC_ID_PREFIX } from '../hooks/useSendMessage'

// True when exactly one new optimistic row was appended at the tail.
// Tolerant of sibling rows (e.g. a date divider) inserted in the same render,
// which happens when the user's send crosses a calendar-day boundary relative
// to the previous last message.
export function shouldForceScrollOnLocalSubmit(args: {
  prevRows: ReadonlyArray<{ key: string }>
  nextRows: ReadonlyArray<{ key: string }>
}): boolean {
  const { prevRows, nextRows } = args
  if (nextRows.length === 0) return false
  const last = nextRows[nextRows.length - 1]
  if (!last.key.startsWith(OPTIMISTIC_ID_PREFIX)) return false
  const prevPending = new Set(
    prevRows.filter((r) => r.key.startsWith(OPTIMISTIC_ID_PREFIX)).map((r) => r.key),
  )
  const newPending = nextRows.filter(
    (r) => r.key.startsWith(OPTIMISTIC_ID_PREFIX) && !prevPending.has(r.key),
  )
  return newPending.length === 1 && newPending[0].key === last.key
}
