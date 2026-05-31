import { describe, expect, it } from 'vitest'
import { useMentionTracker } from '../src/react/useMentionTracker'
// Editor-runtime pieces live on the `@dashway/rich-text/react` entry, not the
// pure-data core (`./index`). Assert the hook is on the react public surface.
import * as reactEntry from '../src/react'

/**
 * Decision D2: the package harness is JSON/tracker-only — no @vitejs/plugin-react
 * or react-dom render dependency. The hook's runtime behavior (subscribe, seed from
 * pre-existing mentions, cleanup) is exercised through the underlying tracker in
 * tracker.test.ts; React rendering of the hook is covered by the consumer
 * (chat-frontend), which already has the React vitest setup. Here we assert the hook
 * is exported on the public surface and is a function (the contract callers depend on).
 */
describe('useMentionTracker — public surface (AC6 / T5)', () => {
  it('is exported from the /react entry point', () => {
    expect(reactEntry.useMentionTracker).toBe(useMentionTracker)
  })

  it('is a function with arity 1 (editor)', () => {
    expect(typeof useMentionTracker).toBe('function')
    expect(useMentionTracker.length).toBe(1)
  })
})
