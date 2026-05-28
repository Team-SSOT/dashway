export {
  CURRENT_SCHEMA_VERSION,
  EXCERPT_LIMIT,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_DEPTH,
  NODE_WHITELIST,
  type WhitelistedNodeType,
} from './constants'
export { deserialize, SchemaVersionUnsupportedError } from './deserialize'
export { serialize } from './serialize'
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
