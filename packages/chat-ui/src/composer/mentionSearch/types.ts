import type { RichTextMention, RichTextMentionType, RichTextPayload } from '@dashway/app-protocol'
import type { NodeKey, SerializedEditorState } from 'lexical'

export type MentionTargetType = RichTextMentionType
export type MentionTarget = RichTextMention

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

export interface ComposerSendPayload extends RichTextPayload<SerializedEditorState> {
  attachments: ComposerAttachment[]
}
