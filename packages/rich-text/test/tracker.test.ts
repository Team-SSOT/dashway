import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { $getRoot, $createParagraphNode } from 'lexical'
import { createMentionTracker, type MentionTracker } from '../src/tracker'
import { extract } from '../src/extract'
import { deserialize } from '../src/deserialize'
import type { MentionRef, MentionTarget, RichTextDocument } from '../src/types'
import {
  appendMention,
  createHeadlessEditor,
  removeNode,
  updateDiscrete,
} from './helpers/editor'

const __dirname = dirname(fileURLToPath(import.meta.url))

function sortRefs(refs: MentionRef[]): MentionRef[] {
  return [...refs].sort((a, b) => a.id.localeCompare(b.id))
}

describe('createMentionTracker — incremental add/remove (AC2)', () => {
  it('100× add/remove keeps tracker.values() == ground truth', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)
    const groundTruth = new Map<string, MentionRef>()
    const keyById = new Map<string, string>()

    for (let i = 0; i < 100; i++) {
      const id = `m${i}`
      const target: MentionTarget = { type: 'person', id, label: `User ${i}` }
      const key = appendMention(editor, target)
      keyById.set(id, key)
      groundTruth.set(id, { id, type: 'person', label: `User ${i}` })
    }
    expect(sortRefs(tracker.values())).toEqual(
      sortRefs(Array.from(groundTruth.values())),
    )

    // Remove every other mention.
    for (let i = 0; i < 100; i += 2) {
      const id = `m${i}`
      removeNode(editor, keyById.get(id)!)
      groundTruth.delete(id)
    }
    expect(sortRefs(tracker.values())).toEqual(
      sortRefs(Array.from(groundTruth.values())),
    )
    expect(tracker.values()).toHaveLength(50)

    tracker.dispose()
  })

  it('get(key) returns the ref for a tracked node', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)
    const key = appendMention(editor, { type: 'team', id: 'T1', label: 'Eng' })
    expect(tracker.get(key)).toEqual({ id: 'T1', type: 'team', label: 'Eng' })
    tracker.dispose()
  })

  it('notifies subscribers on change', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)
    const seen: number[] = []
    const unsub = tracker.subscribe((refs) => seen.push(refs.length))
    appendMention(editor, { type: 'person', id: 'x', label: 'X' })
    appendMention(editor, { type: 'person', id: 'y', label: 'Y' })
    expect(seen).toEqual([1, 2])
    unsub()
    tracker.dispose()
  })
})

describe('createMentionTracker — pre-existing mentions on registration (AC2b)', () => {
  it('populates from a deserialized doc with N pre-existing mentions', () => {
    // Build a doc with 3 mentions, deserialize into a fresh editor, THEN attach
    // the tracker. skipInitialization=false → created fires for existing nodes.
    const builder = createHeadlessEditor()
    let doc!: RichTextDocument
    updateDiscrete(builder, () => {
      const p = $createParagraphNode()
      $getRoot().append(p)
    })
    appendMention(builder, { type: 'person', id: '1', label: 'A' })
    appendMention(builder, { type: 'document', id: '2', label: 'B' })
    appendMention(builder, { type: 'issue', id: '3', label: 'C' })
    // serialize via the package
    doc = { schemaVersion: 1, root: builder.getEditorState().toJSON().root }

    const editor = createHeadlessEditor()
    const state = deserialize(editor, doc)
    editor.setEditorState(state)

    const tracker = createMentionTracker(editor)
    expect(tracker.values()).toHaveLength(3)
    expect(sortRefs(tracker.values())).toEqual([
      { id: '1', type: 'person', label: 'A' },
      { id: '2', type: 'document', label: 'B' },
      { id: '3', type: 'issue', label: 'C' },
    ])
    tracker.dispose()
  })
})

describe('createMentionTracker — dispose unregisters (AC2c)', () => {
  it('handler not invoked after dispose; map does not grow', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)
    appendMention(editor, { type: 'person', id: '1', label: 'A' })
    expect(tracker.values()).toHaveLength(1)

    const notify = vi.fn()
    tracker.subscribe(notify)
    tracker.dispose()
    notify.mockClear()

    // Mutate after dispose — the listener must be unregistered.
    appendMention(editor, { type: 'person', id: '2', label: 'B' })
    expect(notify).not.toHaveBeenCalled()
    // values() is cleared on dispose and never grows afterward.
    expect(tracker.values()).toHaveLength(0)
  })
})

describe('extract on the tracker path triggers zero full-walks (AC3)', () => {
  it('extract with a tracker uses tracker.values(), not the full-walk collector', () => {
    const editor = createHeadlessEditor()
    const tracker = createMentionTracker(editor)

    // Wrap the tracker so we can assert extract pulls mentions from values().
    const valuesSpy = vi.spyOn(tracker, 'values')

    let doc!: RichTextDocument
    for (let i = 0; i < 1000; i++) {
      appendMention(editor, { type: 'person', id: `m${i}`, label: `U${i}` })
    }
    doc = { schemaVersion: 1, root: editor.getEditorState().toJSON().root }

    valuesSpy.mockClear()
    const result = extract(doc, { tracker })

    // The tracker cache was consulted exactly once for mentions...
    expect(valuesSpy).toHaveBeenCalledTimes(1)
    // ...and the mentions match the tracked set (proving the walk branch was skipped).
    expect(result.mentions).toHaveLength(1000)
    expect(result.mentions).toEqual(tracker.values())

    tracker.dispose()
  })

  it('extract WITHOUT a tracker still collects mentions by full walk (control)', () => {
    const editor = createHeadlessEditor()
    appendMention(editor, { type: 'person', id: 'solo', label: 'Solo' })
    const doc: RichTextDocument = {
      schemaVersion: 1,
      root: editor.getEditorState().toJSON().root,
    }
    const result = extract(doc)
    expect(result.mentions).toEqual([{ id: 'solo', type: 'person', label: 'Solo' }])
  })
})

describe('MentionTracker interface shape', () => {
  it('exposes values/get/subscribe/dispose', () => {
    const editor = createHeadlessEditor()
    const tracker: MentionTracker = createMentionTracker(editor)
    expect(typeof tracker.values).toBe('function')
    expect(typeof tracker.get).toBe('function')
    expect(typeof tracker.subscribe).toBe('function')
    expect(typeof tracker.dispose).toBe('function')
    tracker.dispose()
  })
})
