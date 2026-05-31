import type { MentionTarget } from '@dashway/rich-text'
import type { SerializedEditorState } from 'lexical'

// Mention domain + query types are owned by the shared package.
export type { MentionTarget, MentionTargetType } from '@dashway/rich-text'
export type { MentionQuery } from '@dashway/rich-text/editor'

/** Chat-specific composer chrome types (not part of the shared editor). */
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
