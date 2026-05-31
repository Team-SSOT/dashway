/**
 * `@dashway/rich-text` — CORE entry (pure data contract).
 *
 * This entry pulls in NO React/Lexical runtime: only types, constants, and the
 * tree-walking derivations (`extract`, `validate`) plus the search-provider
 * interface. Any app — including a server / RSC consumer that never mounts an
 * editor — can import from `@dashway/rich-text` to validate, extract, or type a
 * stored rich-text document.
 *
 * CANONICAL TYPES: this package is the single source of truth for the rich-text
 * domain types (`MentionTarget`, `MentionTargetType`, `SerializedMentionNode`,
 * and the serialized AST node shapes). Do not fork these — import them here.
 *
 * Editor-runtime pieces (the `MentionNode` Lexical node, the live mention
 * tracker, `serialize`/`deserialize`) live behind the `@dashway/rich-text/react`
 * entry so they never leak into a pure-data consumer's bundle.
 */
export {
  CURRENT_SCHEMA_VERSION,
  EXCERPT_LIMIT,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_DEPTH,
  NODE_WHITELIST,
  type WhitelistedNodeType,
} from './constants'
export type { ExtractOptions } from './extract'
export { extract } from './extract'
export type { MentionSearchInput, MentionSearchProvider } from './search/MentionSearchProvider'
export { fromSearchFn } from './search/MentionSearchProvider'
export type {
  ExtractedRichText,
  HighlightSpan,
  MentionRef,
  MentionTarget,
  MentionTargetType,
  RichTextDocument,
  SchemaVersion,
  SerializedCodeNode,
  SerializedEmojiNode,
  SerializedHeadingNode,
  SerializedLinkNode,
  SerializedListItemNode,
  SerializedListNode,
  SerializedMentionNode,
  SerializedParagraphNode,
  SerializedQuoteNode,
  SerializedRichTextRoot,
  SerializedTextNode,
} from './types'
export type { ValidationError, ValidationErrorCode, ValidationResult } from './validate'
export { validate } from './validate'
