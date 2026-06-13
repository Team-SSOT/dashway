import type { NodeKey } from 'lexical'

/** Arguments the typeahead passes to the injected mention search source. */
export interface MentionQuery {
  query: string
  limit: number
}

/** A captured `@token` range in the editor, used to insert a mention precisely. */
export interface MentionCapturedRange {
  textNodeKey: NodeKey
  tokenStartOffset: number
  tokenEndOffset: number
  tokenText: string
  query: string
}
