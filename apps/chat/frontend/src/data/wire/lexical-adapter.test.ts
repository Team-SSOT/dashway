import { describe, it, expect } from 'vitest'
import { plainTextToLexical, lexicalToPlain } from './lexical-adapter'

describe('plainTextToLexical', () => {
  it('wraps plain text in a paragraph node', () => {
    const result = plainTextToLexical('hello')
    expect(result.root.type).toBe('root')
    const para = (result.root.children as unknown[])[0] as Record<string, unknown>
    expect(para.type).toBe('paragraph')
    const text = (para.children as unknown[])[0] as Record<string, unknown>
    expect(text.text).toBe('hello')
  })

  it('handles empty string', () => {
    const result = plainTextToLexical('')
    const para = (result.root.children as unknown[])[0] as Record<string, unknown>
    expect((para.children as unknown[]).length).toBe(0)
  })
})

describe('lexicalToPlain', () => {
  it('extracts plain text from single paragraph', () => {
    const state = plainTextToLexical('hello world')
    expect(lexicalToPlain(state)).toBe('hello world')
  })

  it('handles multiline (multiple paragraphs)', () => {
    const state = {
      root: {
        children: [
          {
            children: [{ type: 'text', text: 'line1', detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
          {
            children: [{ type: 'text', text: 'line2', detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }
    const result = lexicalToPlain(state as Parameters<typeof lexicalToPlain>[0])
    expect(result).toBe('line1\nline2')
  })

  it('handles emoji in text', () => {
    const state = plainTextToLexical('hello 😀 world')
    expect(lexicalToPlain(state)).toBe('hello 😀 world')
  })

  it('renders mention node as @text with fidelity loss noted', () => {
    // Mention node: targetId is lost in plain text — this is documented fidelity loss.
    // Full mention round-trip requires server-side resolution (V1.2+).
    const state = {
      root: {
        children: [
          {
            children: [
              { type: 'text', text: 'hello ', detail: 0, format: 0, mode: 'normal', style: '', version: 1 },
              { type: 'mention', targetType: 'person', targetId: '1001', label: '홍길동', text: '홍길동', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }
    const result = lexicalToPlain(state as Parameters<typeof lexicalToPlain>[0])
    expect(result).toBe('hello @홍길동')
  })
})
