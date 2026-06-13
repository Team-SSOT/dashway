/**
 * `@dashway/rich-text/editor` — EDITOR entry (Lexical + React editor runtime).
 *
 * Ships a ready-to-mount `<RichTextEditor>` (full plugin stack wired) plus the
 * underlying primitives (config builder, nodes, plugins, mention engine) for
 * apps that assemble their own. The mention SEARCH source is injected per app.
 * Pulls lexical + @lexical/react + @dashway/ui at runtime — import the core
 * `@dashway/rich-text` (`.`) entry for pure-data/read-only use instead.
 */

export type { CreateEditorConfigOptions, EditorTheme } from './editorConfig'
// Config builder + headless theme:
export {
  createEditorConfig,
  DEFAULT_EDITOR_NODES,
  DEFAULT_EDITOR_THEME,
} from './editorConfig'
export type { SerializedEmojiNode } from './emoji/EmojiNode'
// Emoji primitives:
export { $createEmojiNode, $isEmojiNode, EmojiNode } from './emoji/EmojiNode'
export { DEFAULT_EMOJI_MAP } from './emoji/emojiMap'
// Mention engine:
export {
  insertMentionAtCapturedRange,
  insertMentionAtCurrentSelection,
} from './mention/insertMention'
export type { MentionResultListProps } from './mention/MentionResultList'
export {
  MENTION_TYPE_ICONS,
  MENTION_TYPE_LABELS,
  MentionResultList,
} from './mention/MentionResultList'
export type { MentionCapturedRange, MentionQuery } from './mention/types'
// Plugins (for apps assembling their own editor):
export { EmojiReplacePlugin } from './plugins/EmojiReplacePlugin'
export { ImeGuardPlugin } from './plugins/ImeGuardPlugin'
export { MentionTypeaheadPlugin } from './plugins/MentionTypeaheadPlugin'
export { PasteSanitizerPlugin } from './plugins/PasteSanitizerPlugin'
export type { RichTextEditorHandle, RichTextEditorProps } from './RichTextEditor'
// Ready-to-mount editor (apps don't reassemble Lexical):
export { RichTextEditor } from './RichTextEditor'
// Markdown transformers:
export {
  createEmojiTransformer,
  createRichTextTransformers,
  RICH_TEXT_TRANSFORMERS,
} from './transformers'
