import type { SchemaVersion } from './types'

export const CURRENT_SCHEMA_VERSION: SchemaVersion = 1

export const MAX_DOCUMENT_BYTES = 256 * 1024

export const MAX_DOCUMENT_DEPTH = 16

export const NODE_WHITELIST = [
  'paragraph',
  'heading',
  'list',
  'listitem',
  'quote',
  'code',
  'link',
  'mention',
  'text',
] as const

export type WhitelistedNodeType = (typeof NODE_WHITELIST)[number]

export const EXCERPT_LIMIT = 280
