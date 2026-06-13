import { describe, expect, it, vi } from 'vitest'
import {
  fromSearchFn,
  type MentionSearchInput,
  type MentionSearchProvider,
} from '../src/search/MentionSearchProvider'
import type { MentionTarget } from '../src/types'

const sample: MentionTarget[] = [
  { type: 'person', id: '1', label: 'Ada' },
  { type: 'person', id: '2', label: 'Lin' },
]

describe('MentionSearchProvider contract (AC6)', () => {
  it('fromSearchFn wraps an async function into a provider', async () => {
    const fn = vi.fn(async (_input: MentionSearchInput) => sample)
    const provider: MentionSearchProvider = fromSearchFn(fn)
    const out = await provider.search({ query: 'a' })
    expect(out).toEqual(sample)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes the full input (query, types, limit) through', async () => {
    const fn = vi.fn(async (_input: MentionSearchInput) => sample)
    const provider = fromSearchFn(fn)
    const input: MentionSearchInput = { query: 'x', types: ['person', 'team'], limit: 5 }
    await provider.search(input)
    expect(fn).toHaveBeenCalledWith(input)
  })

  it('propagates the AbortSignal to the wrapped function', async () => {
    const controller = new AbortController()
    let received: AbortSignal | undefined
    const provider = fromSearchFn(async (input) => {
      received = input.signal
      return sample
    })
    await provider.search({ query: 'q', signal: controller.signal })
    expect(received).toBe(controller.signal)
  })

  it('a provider can reject when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const provider = fromSearchFn(async (input) => {
      if (input.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      return sample
    })
    await expect(provider.search({ query: 'q', signal: controller.signal })).rejects.toThrow(
      /Aborted/,
    )
  })

  it('a hand-written class also satisfies the interface', async () => {
    class StubProvider implements MentionSearchProvider {
      async search(input: MentionSearchInput): Promise<MentionTarget[]> {
        return sample.filter((s) => s.label.toLowerCase().includes(input.query.toLowerCase()))
      }
    }
    const provider: MentionSearchProvider = new StubProvider()
    expect(await provider.search({ query: 'ad' })).toEqual([
      { type: 'person', id: '1', label: 'Ada' },
    ])
  })
})
