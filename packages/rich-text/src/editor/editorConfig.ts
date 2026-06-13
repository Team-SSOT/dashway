import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import type { EditorThemeClasses, Klass, LexicalNode } from 'lexical'
import { MentionNode } from '../nodes/MentionNode'
import { MENTION_TYPE_CLASSES } from '../render/mentionClasses'
import type { MentionTargetType } from '../types'
import { EmojiNode } from './emoji/EmojiNode'

/** Per-target-type mention chip styling injected into the headless MentionNode. */
type MentionTheme = { base?: string } & Partial<Record<MentionTargetType, string>>
export type EditorTheme = EditorThemeClasses & { mention?: MentionTheme }

/**
 * Default editor theme. Uses the shared design-token Tailwind classes, so it
 * works out-of-the-box in apps that consume `@dashway/design-tokens`. Apps on a
 * different palette pass a `theme` override (merged over this).
 */
export const DEFAULT_EDITOR_THEME: EditorTheme = {
  paragraph: 'mb-1 last:mb-0',
  heading: {
    h1: 'text-xl font-bold my-2',
    h2: 'text-lg font-bold my-2',
    h3: 'text-base font-bold my-2',
  },
  quote: 'border-l-2 border-border pl-3 my-1 text-muted-foreground',
  list: {
    ul: 'list-disc ml-5 my-1',
    ol: 'list-decimal ml-5 my-1',
    listitem: 'my-0.5',
  },
  link: 'text-primary underline',
  code: 'block rounded bg-muted p-2 font-mono text-sm my-2 overflow-x-auto',
  codeHighlight: {},
  text: {
    bold: 'font-bold',
    italic: 'italic',
    strikethrough: 'line-through',
    underline: 'underline',
    code: 'rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]',
  },
  mention: {
    base: 'inline-flex max-w-[16rem] items-center rounded px-1 align-baseline font-medium',
    ...MENTION_TYPE_CLASSES,
  },
}

/** The Lexical nodes the rich-text editor registers by default. */
export const DEFAULT_EDITOR_NODES: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  EmojiNode,
  MentionNode,
]

export interface CreateEditorConfigOptions {
  namespace: string
  /** Theme override, merged over DEFAULT_EDITOR_THEME (incl. the `mention` sub-object). */
  theme?: EditorTheme
  /** Extra nodes appended to DEFAULT_EDITOR_NODES (e.g. an app-specific node). */
  extraNodes?: Array<Klass<LexicalNode>>
  onError?: (error: Error) => void
}

/** Build a Lexical `InitialConfigType` for the rich-text editor. */
export function createEditorConfig({
  namespace,
  theme,
  extraNodes,
  onError,
}: CreateEditorConfigOptions): InitialConfigType {
  const mergedTheme: EditorTheme = {
    ...DEFAULT_EDITOR_THEME,
    ...theme,
    mention: { ...DEFAULT_EDITOR_THEME.mention, ...theme?.mention },
  }
  return {
    namespace,
    nodes: extraNodes ? [...DEFAULT_EDITOR_NODES, ...extraNodes] : DEFAULT_EDITOR_NODES,
    theme: mergedTheme,
    onError:
      onError ??
      ((error) => {
        console.error('[RichTextEditor]', error)
      }),
  }
}
