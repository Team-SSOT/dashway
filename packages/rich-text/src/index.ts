/**
 * @dashway/rich-text — public surface.
 *
 * CANONICAL TYPES: This package is the single source of truth for the rich-text
 * domain types `MentionTarget`, `MentionTargetType`, and `SerializedMentionNode`
 * (see ./types). chat-ui currently declares its own duplicate copies of these;
 * in Phase 2 (T7) those duplicates will collapse into a re-export from this
 * package. Do not fork these types — import them from `@dashway/rich-text`.
 */
export {
  CURRENT_SCHEMA_VERSION,
  EXCERPT_LIMIT,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_DEPTH,
  NODE_WHITELIST,
  type WhitelistedNodeType,
} from './constants'
export { deserialize, SchemaVersionUnsupportedError } from './deserialize'
export { extract } from './extract'
export type { ExtractOptions } from './extract'
export { $createMentionNode, $isMentionNode, MentionNode } from './nodes/MentionNode'
export { useMentionTracker } from './react/useMentionTracker'
export { fromSearchFn } from './search/MentionSearchProvider'
export type { MentionSearchInput, MentionSearchProvider } from './search/MentionSearchProvider'
export { serialize } from './serialize'
export { createMentionTracker } from './tracker'
export type { MentionTracker } from './tracker'
export type {
  ExtractedRichText,
  HighlightSpan,
  MentionRef,
  MentionTarget,
  MentionTargetType,
  RichTextDocument,
  SchemaVersion,
  SerializedMentionNode,
  SerializedRichTextRoot,
} from './types'
export { validate } from './validate'
export type { ValidationError, ValidationErrorCode, ValidationResult } from './validate'
