import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { $createMentionNode, $isMentionNode, MentionNode } from '../src/nodes/MentionNode'
import type { MentionTarget, SerializedMentionNode } from '../src/types'
import { createHeadlessEditor } from './helpers/editor'

const __dirname = dirname(fileURLToPath(import.meta.url))

const parityFixture: SerializedMentionNode = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/parity/chat-ui-mention.json'), 'utf8'),
)

/**
 * Lexical 0.43 requires an active editor context to construct any LexicalNode
 * (the constructor calls $setNodeKey → getActiveEditor). All node creation /
 * import / export must therefore run inside editor.update() or editor.read().
 */
const editor = createHeadlessEditor()
function inEditor<T>(fn: () => T): T {
  let out!: T
  editor.update(
    () => {
      out = fn()
    },
    { discrete: true },
  )
  return out
}

describe('MentionNode — smoke (R3: single Lexical instance)', () => {
  it('$isMentionNode is true for a freshly created node', () => {
    const ok = inEditor(() =>
      $isMentionNode($createMentionNode({ type: 'person', id: '1', label: 'Ada' })),
    )
    expect(ok).toBe(true)
  })

  it('$isMentionNode is false for null/undefined', () => {
    expect($isMentionNode(null)).toBe(false)
    expect($isMentionNode(undefined)).toBe(false)
  })

  it('getType / isInline / textContent contract', () => {
    expect(MentionNode.getType()).toBe('mention')
    const { inline, text } = inEditor(() => {
      const node = $createMentionNode({ type: 'team', id: 't1', label: 'Eng' })
      return { inline: node.isInline(), text: node.getTextContent() }
    })
    expect(inline).toBe(true)
    expect(text).toBe('@Eng')
  })
})

describe('MentionNode — round-trip (AC1)', () => {
  it('exportJSON → importJSON → exportJSON is stable', () => {
    const target: MentionTarget = {
      type: 'document',
      id: 'doc-9',
      label: 'Spec',
      source: 'drive',
      iconUrl: 'https://x/icon.png',
      url: 'https://x/doc/9',
    }
    const { first, reimported } = inEditor(() => {
      const first = $createMentionNode(target).exportJSON()
      const reimported = MentionNode.importJSON(first).exportJSON()
      return { first, reimported }
    })
    expect(reimported).toEqual(first)
  })

  it('description is deliberately NOT serialized', () => {
    const json = inEditor(() =>
      $createMentionNode({
        type: 'person',
        id: '7',
        label: 'Lin',
        description: 'should not appear',
      }).exportJSON(),
    )
    expect('description' in json).toBe(false)
  })
})

describe('MentionNode — static-fixture parity with chat-ui (AC-PARITY)', () => {
  it('importJSON(fixture).exportJSON() deep-equals the committed snapshot', () => {
    const out = inEditor(() => MentionNode.importJSON(parityFixture).exportJSON())
    expect(out).toEqual(parityFixture)
  })

  it('fresh $createMentionNode(target).exportJSON() deep-equals the snapshot', () => {
    const target: MentionTarget = {
      type: parityFixture.targetType,
      id: parityFixture.targetId,
      label: parityFixture.label,
      source: parityFixture.source,
      iconUrl: parityFixture.iconUrl,
      url: parityFixture.url,
    }
    const out = inEditor(() => $createMentionNode(target).exportJSON())
    expect(out).toEqual(parityFixture)
  })
})
