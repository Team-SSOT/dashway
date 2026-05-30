import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { MentionNode } from '@dashway/rich-text'
import { EmojiNode } from './nodes/EmojiNode'

export function createEditorConfig(namespace: string): InitialConfigType {
  return {
    namespace,
    nodes: [
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
    ],
    theme: {
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
      // App-injected styling for the headless @dashway/rich-text MentionNode.
      // Lives here (an app-scanned source file) so Tailwind v4 keeps these classes.
      mention: {
        base: 'inline-flex max-w-[16rem] items-center rounded px-1 align-baseline font-medium',
        person: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
        document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
        app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      },
    },
    onError: (error) => {
      console.error('[DashwayComposer]', error)
    },
  }
}
