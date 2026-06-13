import type { MentionTarget, MentionTargetType } from '../types'

/** Arguments accepted by a mention search. */
export interface MentionSearchInput {
  query: string
  types?: MentionTargetType[]
  limit?: number
  signal?: AbortSignal
}

/**
 * Contract every mention search source implements. The package ships NO concrete
 * fetch implementation — the mock (chat-frontend) and the future context-api client
 * are supplied by the caller and merely satisfy this interface (Principle 3:
 * "search fetcher is injected").
 */
export interface MentionSearchProvider {
  search(input: MentionSearchInput): Promise<MentionTarget[]>
}

/**
 * Wrap a plain async search function into a `MentionSearchProvider`. Lets callers
 * adapt an existing function (e.g. chat-frontend's `searchMockMentionTargets`) to
 * the interface in Phase 2 without the package importing any directory/mock.
 */
export function fromSearchFn(
  fn: (input: MentionSearchInput) => Promise<MentionTarget[]>,
): MentionSearchProvider {
  return { search: fn }
}
