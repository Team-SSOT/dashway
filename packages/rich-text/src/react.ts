/**
 * `@dashway/rich-text/react` — EDITOR entry (Lexical + React runtime).
 *
 * Everything here needs a live `LexicalEditor` and/or React at runtime: the
 * `MentionNode` decorator node, the mention tracker, the React hook, and the
 * editor-bound `serialize`/`deserialize`. Importing this entry pulls in
 * `lexical` (+ `@lexical/react`, `react`). Apps that only read/validate stored
 * documents should import the core `@dashway/rich-text` entry instead.
 *
 * Re-exports the full core surface for convenience, so an editor consumer can
 * import types and editor pieces from a single specifier.
 */

export { deserialize, SchemaVersionUnsupportedError } from './deserialize'
export * from './index'
export { $createMentionNode, $isMentionNode, MentionNode } from './nodes/MentionNode'
export { useMentionTracker } from './react/useMentionTracker'
export { serialize } from './serialize'
export type { MentionTracker } from './tracker'
export { createMentionTracker } from './tracker'
