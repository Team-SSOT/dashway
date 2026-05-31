import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EXCERPT_LIMIT } from '../src/constants'
import { extract, extractMentionTargets } from '../src/extract'
import type { RichTextDocument, SerializedRichTextRoot } from '../src/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const extractDir = join(__dirname, 'fixtures/extract')
const roundtripDir = join(__dirname, 'fixtures/roundtrip')

function load(dir: string, file: string): RichTextDocument {
  return JSON.parse(readFileSync(join(dir, file), 'utf8'))
}

describe('extract — plain / excerpt determinism (AC4)', () => {
  it('renders plain text with mentions inlined as @label', () => {
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc)
    expect(result.plain).toBe('cc @Ada and @Lin')
  })

  it('collects mentions by full walk when no tracker is supplied', () => {
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc)
    expect(result.mentions).toEqual([
      { id: 'a', type: 'person', label: 'Ada' },
      { id: 'b', type: 'person', label: 'Lin' },
    ])
  })

  it('excerpt equals plain when under the limit', () => {
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc)
    expect(result.excerpt).toBe(result.plain)
    expect(result.excerpt.length).toBeLessThanOrEqual(EXCERPT_LIMIT)
  })

  it('excerpt is clamped to EXCERPT_LIMIT for a long document', () => {
    const doc = load(extractDir, 'long-excerpt.json')
    const result = extract(doc)
    expect(result.plain.length).toBe(400)
    expect(result.excerpt.length).toBe(EXCERPT_LIMIT)
    expect(result.excerpt).toBe('x'.repeat(EXCERPT_LIMIT))
  })

  it('honors a custom excerptLimit', () => {
    const doc = load(extractDir, 'long-excerpt.json')
    const result = extract(doc, { excerptLimit: 10 })
    expect(result.excerpt).toBe('x'.repeat(10))
  })

  it('renders block newlines between paragraphs and trims trailing', () => {
    const doc = load(roundtripDir, '017-multi-paragraph.json')
    const result = extract(doc)
    expect(result.plain).toBe(
      'paragraph number 0\nparagraph number 1\nparagraph number 2\nparagraph number 3\nparagraph number 4',
    )
  })

  it('is deterministic across repeated calls', () => {
    const doc = load(extractDir, 'highlight-basic.json')
    expect(extract(doc)).toEqual(extract(doc))
  })
})

describe('extract — highlightSlice offset determinism (AC4b)', () => {
  it('computes mention spans against plain-text offsets', () => {
    // plain = "cc @Ada and @Lin"
    //          0123456789...
    // "@Ada" at [3,7), "@Lin" at [12,16)
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc)
    expect(result.highlightSlice).toEqual([
      { start: 3, end: 7, refId: 'a' },
      { start: 12, end: 16, refId: 'b' },
    ])
  })

  it('refIds align with the collected mention order', () => {
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc)
    const refIds = result.highlightSlice.map((s) => s.refId)
    expect(refIds).toEqual(result.mentions.map((m) => m.id))
  })

  it('drops spans that fall entirely outside the excerpt window', () => {
    // With excerptLimit=4, only "cc @" fits; the first mention starts at 3 (kept,
    // clamped to end=4); the second mention at 12 is past the window (dropped).
    const doc = load(extractDir, 'highlight-basic.json')
    const result = extract(doc, { excerptLimit: 4 })
    expect(result.highlightSlice).toEqual([{ start: 3, end: 4, refId: 'a' }])
  })

  it('produces no spans for a mention-free document', () => {
    const doc = load(roundtripDir, '002-plain.json')
    const result = extract(doc)
    expect(result.highlightSlice).toEqual([])
    expect(result.mentions).toEqual([])
  })
})

describe('extractMentionTargets — full targets for send payloads', () => {
  const root = {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'text',
            text: 'hi ',
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
          {
            type: 'mention',
            version: 1,
            targetType: 'document',
            targetId: 'doc-1',
            label: 'Spec',
            source: 'Docs',
            iconUrl: 'https://x/i.png',
            url: 'https://x/doc-1',
            text: '@Spec',
          },
          {
            // duplicate of the same target (collapsed by type:id dedup)
            type: 'mention',
            version: 1,
            targetType: 'document',
            targetId: 'doc-1',
            label: 'Spec',
            source: 'Docs',
            iconUrl: 'https://x/i.png',
            url: 'https://x/doc-1',
            text: '@Spec',
          },
          {
            type: 'mention',
            version: 1,
            targetType: 'person',
            targetId: 'alice',
            label: 'Alice',
            text: '@Alice',
          },
        ],
      },
    ],
  } as unknown as SerializedRichTextRoot

  it('returns full MentionTarget incl. source/iconUrl/url, de-duplicated by type:id', () => {
    expect(extractMentionTargets(root)).toEqual([
      {
        type: 'document',
        id: 'doc-1',
        label: 'Spec',
        source: 'Docs',
        iconUrl: 'https://x/i.png',
        url: 'https://x/doc-1',
      },
      {
        type: 'person',
        id: 'alice',
        label: 'Alice',
        source: undefined,
        iconUrl: undefined,
        url: undefined,
      },
    ])
  })

  it('returns [] for a mention-free document', () => {
    const doc = load(roundtripDir, '002-plain.json')
    expect(extractMentionTargets(doc.root)).toEqual([])
  })
})
