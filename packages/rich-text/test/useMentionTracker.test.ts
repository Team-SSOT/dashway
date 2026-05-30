import { describe, expect, it } from 'vitest'
import { useMentionTracker } from '../src/react/useMentionTracker'
import * as pkg from '../src/index'

/**
 * Decision D2: the package harness is JSON/tracker-only — no @vitejs/plugin-react
 * or react-dom render dependency. The hook's runtime behavior (subscribe, seed from
 * pre-existing mentions, cleanup) is exercised through the underlying tracker in
 * tracker.test.ts; React rendering of the hook is covered by the consumer
 * (chat-frontend), which already has the React vitest setup. Here we assert the hook
 * is exported on the public surface and is a function (the contract callers depend on).
 */
describe('useMentionTracker — public surface (AC6 / T5)', () => {
  it('is exported from the package entry point', () => {
    expect(pkg.useMentionTracker).toBe(useMentionTracker)
  })

  it('is a function with arity 1 (editor)', () => {
    expect(typeof useMentionTracker).toBe('function')
    expect(useMentionTracker.length).toBe(1)
  })
})
