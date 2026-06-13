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

/**
 * Serialized AST node contract — the read-side complement to the write-side
 * `MentionNode.exportJSON`. These structural shapes describe the JSON any app
 * receives for a stored rich-text document, so a renderer in ANY app (chat,
 * issue_tracker, …) can walk the tree against a single typed contract instead
 * of re-declaring node shapes locally. Pure data: `import type` from lexical
 * only, erased at build — no editor/runtime dependency.
 */
export interface SerializedTextNode extends SerializedLexicalNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: string
  style: string
}

export interface SerializedParagraphNode extends SerializedLexicalNode {
  type: 'paragraph'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

export interface SerializedHeadingNode extends SerializedLexicalNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

export interface SerializedQuoteNode extends SerializedLexicalNode {
  type: 'quote'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

export interface SerializedListNode extends SerializedLexicalNode {
  type: 'list'
  listType: 'bullet' | 'number' | 'check'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  tag: string
  start: number
}

export interface SerializedListItemNode extends SerializedLexicalNode {
  type: 'listitem'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  value: number
  checked?: boolean
}

export interface SerializedLinkNode extends SerializedLexicalNode {
  type: 'link'
  url: string
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  rel?: string
  target?: string
  title?: string | null
}

export interface SerializedCodeNode extends SerializedLexicalNode {
  type: 'code'
  language?: string
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

export interface SerializedEmojiNode extends SerializedLexicalNode {
  type: 'emoji'
  shortcode?: string
  char?: string
  text?: string
}
