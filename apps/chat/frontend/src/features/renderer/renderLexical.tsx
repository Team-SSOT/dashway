import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import { type ReactNode } from 'react'
import { MentionRender } from './nodes/MentionRender'
import { CodeBlockRender } from './nodes/CodeBlockRender'

export interface RenderLexicalOpts {
  /** Members lookup for MentionNode rendering (name fallback to id) */
  membersById?: Record<string, { id: string; name: string }>
}

// Serialized node shapes beyond the base type
interface SerializedTextNode extends SerializedLexicalNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: string
  style: string
}

interface SerializedParagraphNode extends SerializedLexicalNode {
  type: 'paragraph'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

interface SerializedHeadingNode extends SerializedLexicalNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

interface SerializedQuoteNode extends SerializedLexicalNode {
  type: 'quote'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

interface SerializedListNode extends SerializedLexicalNode {
  type: 'list'
  listType: 'bullet' | 'number' | 'check'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  tag: string
  start: number
}

interface SerializedListItemNode extends SerializedLexicalNode {
  type: 'listitem'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  value: number
  checked?: boolean
}

interface SerializedLinkNode extends SerializedLexicalNode {
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

interface SerializedCodeNode extends SerializedLexicalNode {
  type: 'code'
  language?: string
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
}

interface SerializedEmojiNode extends SerializedLexicalNode {
  type: 'emoji'
  shortcode?: string
  char?: string
  text?: string
}

interface SerializedMentionNode extends SerializedLexicalNode {
  type: 'mention'
  targetType?: 'person' | 'document' | 'issue' | 'team' | 'app'
  targetId?: string
  memberId?: string
  id?: string
  label?: string
  text?: string
  source?: string
}

interface SerializedRootNode {
  type: 'root'
  children: SerializedLexicalNode[]
  direction: string | null
  format: string | number
  indent: number
  version: number
}

// Text format bitmask constants
const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

function applyTextFormat(format: number, content: ReactNode): ReactNode {
  // Apply from outside in: bold → italic → underline → strikethrough → code
  let result = content
  if (format & FORMAT_CODE) {
    result = (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]">
        {result}
      </code>
    )
  }
  if (format & FORMAT_STRIKETHROUGH) {
    result = <s>{result}</s>
  }
  if (format & FORMAT_UNDERLINE) {
    result = <u>{result}</u>
  }
  if (format & FORMAT_ITALIC) {
    result = <em>{result}</em>
  }
  if (format & FORMAT_BOLD) {
    result = <strong>{result}</strong>
  }
  return result
}

function walkNodes(
  nodes: SerializedLexicalNode[],
  opts: RenderLexicalOpts,
  pathPrefix: string,
): ReactNode[] {
  return nodes.map((node, idx) => {
    const key = `${pathPrefix}-${idx}`
    return walkNode(node, opts, key)
  })
}

function walkNode(
  node: SerializedLexicalNode,
  opts: RenderLexicalOpts,
  key: string,
): ReactNode {
  switch (node.type) {
    case 'linebreak':
      return <br key={key} />

    case 'tab':
      return <span key={key}>&nbsp;&nbsp;</span>

    case 'text': {
      const textNode = node as SerializedTextNode
      const content: ReactNode = textNode.text
      return <span key={key}>{applyTextFormat(textNode.format, content)}</span>
    }

    case 'paragraph': {
      const paraNode = node as SerializedParagraphNode
      const children = walkNodes(paraNode.children ?? [], opts, key)
      return (
        <p key={key} className="mb-1 last:mb-0 whitespace-pre-wrap">
          {children}
        </p>
      )
    }

    case 'heading': {
      const headingNode = node as SerializedHeadingNode
      const children = walkNodes(headingNode.children ?? [], opts, key)
      const Tag = headingNode.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag key={key} className="font-bold my-2">
          {children}
        </Tag>
      )
    }

    case 'quote': {
      const quoteNode = node as SerializedQuoteNode
      const children = walkNodes(quoteNode.children ?? [], opts, key)
      return (
        <blockquote
          key={key}
          className="border-l-2 border-border pl-3 my-2 text-muted-foreground"
        >
          {children}
        </blockquote>
      )
    }

    case 'list': {
      const listNode = node as SerializedListNode
      const children = walkNodes(listNode.children ?? [], opts, key)
      if (listNode.listType === 'number') {
        return (
          <ol key={key} className="list-decimal ml-5 my-1">
            {children}
          </ol>
        )
      }
      return (
        <ul key={key} className="list-disc ml-5 my-1">
          {children}
        </ul>
      )
    }

    case 'listitem': {
      const liNode = node as SerializedListItemNode
      const children = walkNodes(liNode.children ?? [], opts, key)
      return <li key={key}>{children}</li>
    }

    case 'link': {
      const linkNode = node as SerializedLinkNode
      const children = walkNodes(linkNode.children ?? [], opts, key)
      return (
        <a
          key={key}
          href={linkNode.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {children}
        </a>
      )
    }

    case 'code': {
      const codeNode = node as SerializedCodeNode
      // Aggregate text from children: text/code-highlight nodes join as text, linebreak nodes become '\n'
      const codeText = aggregateCodeText(codeNode.children ?? [])
      return (
        <CodeBlockRender key={key} code={codeText} language={codeNode.language} />
      )
    }

    case 'emoji': {
      const emojiNode = node as SerializedEmojiNode
      const char = emojiNode.char ?? emojiNode.text ?? ''
      const shortcode = emojiNode.shortcode ?? char
      return (
        <span key={key} role="img" aria-label={shortcode}>
          {char}
        </span>
      )
    }

    case 'mention': {
      const mentionNode = node as SerializedMentionNode
      const targetType = mentionNode.targetType ?? 'person'
      const targetId = mentionNode.targetId ?? mentionNode.memberId ?? mentionNode.id ?? ''
      const label = mentionNode.label ?? mentionNode.text ?? targetId
      const displayName = targetType === 'person' ? opts.membersById?.[targetId]?.name : undefined
      return (
        <MentionRender
          key={key}
          targetId={targetId}
          targetType={targetType}
          label={label}
          displayName={displayName}
          source={mentionNode.source}
        />
      )
    }

    default: {
      // Unknown node type — walk children if present, else render text property
      const unknown = node as SerializedLexicalNode & {
        children?: SerializedLexicalNode[]
        text?: string
      }
      if (unknown.children && unknown.children.length > 0) {
        return (
          <span key={key}>{walkNodes(unknown.children, opts, key)}</span>
        )
      }
      if (unknown.text) {
        return <span key={key}>{unknown.text}</span>
      }
      return null
    }
  }
}

/** Aggregate code text from Lexical code node children.
 * text/code-highlight nodes contribute their text; linebreak nodes become '\n'. */
function aggregateCodeText(nodes: SerializedLexicalNode[]): string {
  return nodes
    .map((node) => {
      const n = node as SerializedLexicalNode & {
        text?: string
        children?: SerializedLexicalNode[]
      }
      if (node.type === 'linebreak') return '\n'
      if (n.text !== undefined) return n.text
      if (n.children) return aggregateCodeText(n.children)
      return ''
    })
    .join('')
}

export function renderLexical(
  state: SerializedEditorState,
  opts: RenderLexicalOpts = {},
): ReactNode {
  try {
    const root = state.root as SerializedRootNode
    if (!root || !Array.isArray(root.children)) {
      console.warn('[renderLexical] Invalid root node structure')
      return <span className="text-destructive">[Malformed message]</span>
    }
    const children = walkNodes(root.children, opts, 'root')
    return <>{children}</>
  } catch (err) {
    console.warn('[renderLexical] Failed to render editor state:', err)
    return <span className="text-destructive">[Malformed message]</span>
  }
}
