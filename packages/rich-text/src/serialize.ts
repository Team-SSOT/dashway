import type { LexicalEditor } from 'lexical'
import { CURRENT_SCHEMA_VERSION } from './constants'
import type { RichTextDocument } from './types'

export function serialize(editor: LexicalEditor): RichTextDocument {
  const state = editor.getEditorState().toJSON()
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    root: state.root,
  }
}
