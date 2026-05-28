import type { SerializedEditorState, SerializedLexicalNode, Spread } from 'lexical'

export type SchemaVersion = number

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

export type MentionRef = Pick<MentionTarget, 'id' | 'type' | 'label'>

export interface HighlightSpan {
  start: number
  end: number
  refId: string
}

export interface ExtractedRichText {
  plain: string
  excerpt: string
  mentions: MentionRef[]
  highlightSlice: HighlightSpan[]
}

export type SerializedRichTextRoot = SerializedEditorState['root']

export interface RichTextDocument {
  schemaVersion: SchemaVersion
  root: SerializedRichTextRoot
}

export type SerializedMentionNode = Spread<
  {
    type: 'mention'
    targetType: MentionTargetType
    targetId: string
    label: string
    source?: string
    iconUrl?: string
    url?: string
    text: string
    version: 1
  },
  SerializedLexicalNode
>
