import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
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
    },
    onError: (error) => {
      console.error('[Lexical]', error)
    },
  }
}
