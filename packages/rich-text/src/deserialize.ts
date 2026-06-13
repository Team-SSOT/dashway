import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'
import { CURRENT_SCHEMA_VERSION } from './constants'
import type { RichTextDocument, SchemaVersion } from './types'

export class SchemaVersionUnsupportedError extends Error {
  readonly received: SchemaVersion
  readonly supported: SchemaVersion

  constructor(received: SchemaVersion, supported: SchemaVersion) {
    super(`RichTextDocument schemaVersion ${received} is not supported (current=${supported})`)
    this.name = 'SchemaVersionUnsupportedError'
    this.received = received
    this.supported = supported
  }
}

export function deserialize(editor: LexicalEditor, doc: RichTextDocument): EditorState {
  if (doc.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new SchemaVersionUnsupportedError(doc.schemaVersion, CURRENT_SCHEMA_VERSION)
  }
  const payload: SerializedEditorState = { root: doc.root }
  return editor.parseEditorState(payload)
}
