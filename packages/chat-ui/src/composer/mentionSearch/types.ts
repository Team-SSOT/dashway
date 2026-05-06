import type { NodeKey, SerializedEditorState } from 'lexical'

export type MentionTargetType = 'person' | 'document' | 'issue' | 'team' | 'app'

export interface MentionTarget {
  type: MentionTargetType
  id: string
  label: string
  description?: string
  source?: string
  iconUrl?: string
  url?: string
}

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
