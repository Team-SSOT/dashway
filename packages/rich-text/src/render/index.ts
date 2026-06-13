/**
 * `@dashway/rich-text/render` — READ entry (React display, no editor runtime).
 *
 * Renders a stored `SerializedEditorState` to React nodes so every app reads
 * rich text the same way without re-implementing the Lexical AST walk. Depends
 * only on React (peer) + lexical *types* (erased) — no live `LexicalEditor`, no
 * syntax highlighter, no design-system runtime. App-specific pieces (code-block
 * highlighting, alternate palettes) are injected via `renderLexical` options.
 */

export { CodeBlockRender } from './CodeBlockRender'
export type { MentionRenderProps } from './MentionRender'
export { MentionRender } from './MentionRender'
export { MENTION_TYPE_CLASSES } from './mentionClasses'
export type {
  CodeRenderer,
  MentionRenderer,
  RenderClasses,
  RenderLexicalOpts,
} from './renderLexical'
export {
  DEFAULT_RENDER_CLASSES,
  renderLexical,
} from './renderLexical'
