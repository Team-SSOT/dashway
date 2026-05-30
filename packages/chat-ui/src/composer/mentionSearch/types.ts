import type { NodeKey, SerializedEditorState } from 'lexical'

export type { MentionTarget, MentionTargetType } from '@dashway/rich-text'

// Imported for local interfaces below (e.g. ComposerSendPayload.mentions).
import type { MentionTarget } from '@dashway/rich-text'

export interface MentionQuery {
  query: string
  limit: number
}

export type MentionToken = symbol

export interface MentionCapturedRange {
  textNodeKey: NodeKey
  tokenStartOffset: number
  tokenEndOffset: number
  tokenText: string
  query: string
}

export interface ComposerAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  previewUrl?: string
  status: 'mock-ready'
}

export interface ComposerSendPayload {
  content: SerializedEditorState
  plainText: string
  mentions: MentionTarget[]
  attachments: ComposerAttachment[]
}
