import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { serialize } from '../src/serialize'
import { deserialize, SchemaVersionUnsupportedError } from '../src/deserialize'
import type { RichTextDocument } from '../src/types'
import { createHeadlessEditor } from './helpers/editor'

const __dirname = dirname(fileURLToPath(import.meta.url))
const roundtripDir = join(__dirname, 'fixtures/roundtrip')

const fixtureFiles = readdirSync(roundtripDir).filter((f) => f.endsWith('.json'))

function load(file: string): RichTextDocument {
  return JSON.parse(readFileSync(join(roundtripDir, file), 'utf8'))
}

describe('serialize / deserialize round-trip (AC1)', () => {
  it('has 30+ golden fixtures', () => {
    expect(fixtureFiles.length).toBeGreaterThanOrEqual(30)
  })

  for (const file of fixtureFiles) {
    it(`round-trips ${file} losslessly`, () => {
      const doc = load(file)
      const editor = createHeadlessEditor()
      const state = deserialize(editor, doc)
      editor.setEditorState(state)
      const out = serialize(editor)
      expect(out).toEqual(doc)
    })
  }
})

describe('deserialize — schemaVersion guard', () => {
  it('throws SchemaVersionUnsupportedError for an unsupported version', () => {
    const doc = load(fixtureFiles[0])
    const editor = createHeadlessEditor()
    expect(() => deserialize(editor, { ...doc, schemaVersion: 999 })).toThrow(
      SchemaVersionUnsupportedError,
    )
  })

  it('error carries received + supported versions', () => {
    const doc = load(fixtureFiles[0])
    const editor = createHeadlessEditor()
    try {
      deserialize(editor, { ...doc, schemaVersion: 2 })
      throw new Error('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(SchemaVersionUnsupportedError)
      expect((err as SchemaVersionUnsupportedError).received).toBe(2)
      expect((err as SchemaVersionUnsupportedError).supported).toBe(1)
    }
  })
})
