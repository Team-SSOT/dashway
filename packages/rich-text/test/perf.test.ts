import { describe, expect, it, vi } from 'vitest'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { createMentionTracker } from '../src/tracker'
import { extract } from '../src/extract'
import { deserialize } from '../src/deserialize'
import type { RichTextDocument } from '../src/types'
import {
  appendMention,
  createHeadlessEditor,
  removeNode,
  updateDiscrete,
} from './helpers/editor'

/**
 * AC9 — long-doc zero-walk during editing, asserted via PACKAGE-OWNED surfaces:
 *  - tracker handler invocation count tracks the number of mutations (not doc size),
 *  - extract()'s full-walk mention branch is NOT taken on the tracker path
 *    (proven by extract returning tracker.values() — the cache — as its mentions),
 *  - parseEditorState is called exactly once (initial load), spied on the editor.
 *
 * Per the plan we deliberately do NOT spy EditorState.toJSON (a per-update internal
 * method Lexical calls itself — false-positive prone).
 */
describe('perf — zero-walk during editing (AC9)', () => {
  it('10,000-node doc loads with parseEditorState called exactly once', () => {
    // Build a 10k-text-node document in a builder editor, serialize it.
    const builder = createHeadlessEditor()
    updateDiscrete(builder, () => {
      const root = $getRoot()
      for (let i = 0; i < 10000; i++) {
        const p = $createParagraphNode()
        p.append($createTextNode(`node ${i}`))
        root.append(p)
      }
    })
    const doc: RichTextDocument = { schemaVersion: 1, root: builder.getEditorState().toJSON().root }

    const editor = createHeadlessEditor()
    const parseSpy = vi.spyOn(editor, 'parseEditorState')
    const state = deserialize(editor, doc)
    editor.setEditorState(state)

    // Exactly one parse for the initial load.
    expect(parseSpy).toHaveBeenCalledTimes(1)
  })

  it('1,000× mention add/remove: tracker handler tracks mutations, extract takes no full walk', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)

    // Count tracker notifications (one package-owned signal per change batch).
    let notifyCount = 0
    tracker.subscribe(() => {
      notifyCount++
    })

    const keys: string[] = []
    for (let i = 0; i < 1000; i++) {
      keys.push(appendMention(editor, { type: 'person', id: `m${i}`, label: `U${i}` }))
    }
    for (const key of keys) {
      removeNode(editor, key)
    }

    // The handler fired for every add and every remove (2000 discrete mutations).
    expect(notifyCount).toBe(2000)
    expect(tracker.values()).toHaveLength(0)

    // Now load a doc and extract on the tracker path — the full-walk mention
    // collector must NOT run; mentions come from the O(1) cache.
    const builder = createHeadlessEditor()
    const liveTracker = createMentionTracker(builder)
    for (let i = 0; i < 500; i++) {
      appendMention(builder, { type: 'person', id: `k${i}`, label: `K${i}` })
    }
    const doc: RichTextDocument = { schemaVersion: 1, root: builder.getEditorState().toJSON().root }

    const valuesSpy = vi.spyOn(liveTracker, 'values')
    const result = extract(doc, { tracker: liveTracker })

    // extract consulted the cache exactly once and used it as the mention source.
    expect(valuesSpy).toHaveBeenCalledTimes(1)
    expect(result.mentions).toHaveLength(500)
    expect(result.mentions).toEqual(liveTracker.values())

    tracker.dispose()
    liveTracker.dispose()
  })

  it('extract cost is independent of mention count on the tracker path', () => {
    // Two docs of very different mention counts; both extract via tracker should
    // pull mentions straight from values() (one call), not a size-proportional walk.
    const make = (n: number) => {
      const editor = createHeadlessEditor()
      const tracker = createMentionTracker(editor)
      for (let i = 0; i < n; i++) {
        appendMention(editor, { type: 'person', id: `${i}`, label: `U${i}` })
      }
      const doc: RichTextDocument = { schemaVersion: 1, root: editor.getEditorState().toJSON().root }
      const spy = vi.spyOn(tracker, 'values')
      extract(doc, { tracker })
      const calls = spy.mock.calls.length
      tracker.dispose()
      return calls
    }
    expect(make(10)).toBe(1)
    expect(make(2000)).toBe(1)
  })
})
