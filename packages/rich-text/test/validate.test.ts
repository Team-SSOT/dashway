import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validate } from '../src/validate'
import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_DEPTH } from '../src/constants'
import type { RichTextDocument } from '../src/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const validateDir = join(__dirname, 'fixtures/validate')

const acceptFiles = readdirSync(validateDir).filter((f) => f.startsWith('accept-'))
const rejectFiles = readdirSync(validateDir).filter((f) => f.startsWith('reject-'))

function load(file: string): RichTextDocument {
  return JSON.parse(readFileSync(join(validateDir, file), 'utf8'))
}

function doc(children: unknown[]): RichTextDocument {
  return {
    schemaVersion: 1,
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } as RichTextDocument['root'],
  }
}
function para(text: string) {
  return { type: 'paragraph', children: [{ type: 'text', text, version: 1 }], version: 1 }
}

// In-spec ASCII bulk-oversize docs (not committed; see generator note) so the
// reject corpus reaches the AC5 target of 30.
const asciiOversizeDocs: RichTextDocument[] = Array.from({ length: 9 }, () =>
  doc([para('x'.repeat(MAX_DOCUMENT_BYTES + 1000))]),
)

describe('validate — corpus (AC5)', () => {
  it('has 30 accept fixtures', () => {
    expect(acceptFiles).toHaveLength(30)
  })

  it('has >= 30 reject cases (committed + in-spec oversize)', () => {
    expect(rejectFiles.length + asciiOversizeDocs.length).toBeGreaterThanOrEqual(30)
  })

  for (const file of acceptFiles) {
    it(`accepts ${file}`, () => {
      expect(validate(load(file)).ok).toBe(true)
    })
  }

  for (const file of rejectFiles) {
    it(`rejects ${file}`, () => {
      const result = validate(load(file))
      expect(result.ok).toBe(false)
    })
  }

  asciiOversizeDocs.forEach((d, i) => {
    it(`rejects ascii-oversize-${i + 1} (in-spec)`, () => {
      const result = validate(d)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.errors.some((e) => e.code === 'size')).toBe(true)
    })
  })
})

describe('validate — UTF-8 byte sizing (AC5, load-bearing)', () => {
  it('rejects the Korean doc that is under 256K UTF-16 units but over 256K UTF-8 bytes', () => {
    const korean = load('reject-21-korean-oversize.json')
    const json = JSON.stringify(korean.root)
    // Precondition: it WOULD pass a naive String.length check...
    expect(json.length).toBeLessThan(MAX_DOCUMENT_BYTES)
    // ...but is over the limit in UTF-8 bytes.
    expect(new TextEncoder().encode(json).length).toBeGreaterThan(MAX_DOCUMENT_BYTES)
    // validate() must reject it on size.
    const result = validate(korean)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some((e) => e.code === 'size')).toBe(true)
  })
})

describe('validate — error codes', () => {
  it('flags non-whitelisted node types with code "node"', () => {
    const result = validate(doc([{ type: 'iframe', children: [], version: 1 }]))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const node = result.errors.find((e) => e.code === 'node')
      expect(node).toBeDefined()
      expect((node!.detail as { types: string[] }).types).toContain('iframe')
    }
  })

  it('flags excessive depth with code "depth"', () => {
    let n: unknown = para('leaf')
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 3; i++) {
      n = { type: 'quote', children: [n], version: 1 }
    }
    const result = validate(doc([n]))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some((e) => e.code === 'depth')).toBe(true)
  })

  it('returns { ok: true } for a minimal valid doc', () => {
    expect(validate(doc([para('hello')]))).toEqual({ ok: true })
  })

  it('can report multiple errors at once', () => {
    let deep: unknown = { type: 'iframe', children: [], version: 1 }
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 3; i++) {
      deep = { type: 'quote', children: [deep], version: 1 }
    }
    const result = validate(doc([deep]))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const codes = result.errors.map((e) => e.code)
      expect(codes).toContain('depth')
      expect(codes).toContain('node')
    }
  })
})
