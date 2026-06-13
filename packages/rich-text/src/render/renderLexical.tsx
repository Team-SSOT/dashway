import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { ReactNode } from 'react'
import type {
  MentionTargetType,
  SerializedCodeNode,
  SerializedEmojiNode,
  SerializedHeadingNode,
  SerializedLinkNode,
  SerializedListItemNode,
  SerializedListNode,
  SerializedMentionNode,
  SerializedParagraphNode,
  SerializedQuoteNode,
  SerializedRichTextRoot,
  SerializedTextNode,
} from '../types'
import { MentionRender } from './MentionRender'

/** Per-node class strings. Apps that share the design tokens get sensible
 *  defaults; others override individual keys via `RenderLexicalOpts.classes`. */
export interface RenderClasses {
  paragraph: string
  heading: string
  quote: string
  listBullet: string
  listNumber: string
  link: string
  inlineCode: string
  codeBlock: string
  error: string
}

export const DEFAULT_RENDER_CLASSES: RenderClasses = {
  paragraph: 'mb-1 last:mb-0 whitespace-pre-wrap',
  heading: 'font-bold my-2',
  quote: 'border-l-2 border-border pl-3 my-2 text-muted-foreground',
  listBullet: 'list-disc ml-5 my-1',
  listNumber: 'list-decimal ml-5 my-1',
  link: 'text-primary underline',
  inlineCode: 'rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]',
  codeBlock: 'overflow-x-auto rounded-md border border-border bg-muted p-3 my-2 text-sm font-mono',
  error: 'text-destructive',
}

export type CodeRenderer = (props: { code: string; language?: string | null }) => ReactNode
export type MentionRenderer = (props: {
  targetId: string
  targetType: MentionTargetType
  label: string
  displayName?: string
  source?: string
}) => ReactNode

export interface RenderLexicalOpts {
  /** Members lookup for person-mention name resolution (falls back to label/id). */
  membersById?: Record<string, { id: string; name: string }>
  /** Per-node class overrides, merged over DEFAULT_RENDER_CLASSES. */
  classes?: Partial<RenderClasses>
  /**
   * Component overrides for nodes that need real app behavior. The package ships
   * a plain `<pre><code>` code block; apps inject a richer one (e.g. syntax
   * highlighting) here without coupling the package to a highlighter.
   */
  components?: { code?: CodeRenderer; mention?: MentionRenderer }
}

/** Resolved, per-call rendering context (defaults merged once). */
interface RenderCtx {
  classes: RenderClasses
  components: { code?: CodeRenderer; mention?: MentionRenderer }
  membersById?: Record<string, { id: string; name: string }>
}

/**
 * Pre-canonical chat-ui mention wire shape. The canonical writer
 * (`MentionNode.exportJSON`) emits `targetType`/`targetId`, but older seeded /
 * server payloads may still carry `memberId` (untyped, person-only). Isolated
 * here as an explicit migration shim — do NOT loosen the canonical type to
 * absorb these. Remove once all producers emit the canonical shape.
 */
interface LegacySerializedMentionNode extends SerializedLexicalNode {
  type: 'mention'
  memberId?: string
  id?: string
}

/** Normalize canonical + legacy mention payloads into render-ready fields. */
function resolveMention(node: SerializedMentionNode & LegacySerializedMentionNode): {
  targetId: string
  targetType: MentionTargetType
  label: string
} {
  const targetType = node.targetType ?? 'person'
  const targetId = node.targetId ?? node.memberId ?? node.id ?? ''
  const label = node.label ?? node.text ?? targetId
  return { targetId, targetType, label }
}

// Text format bitmask constants
const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

function applyTextFormat(format: number, content: ReactNode, ctx: RenderCtx): ReactNode {
  // Apply from outside in: bold → italic → underline → strikethrough → code
  let result = content
  if (format & FORMAT_CODE) {
    result = <code className={ctx.classes.inlineCode}>{result}</code>
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
  ctx: RenderCtx,
  pathPrefix: string,
): ReactNode[] {
  return nodes.map((node, idx) => walkNode(node, ctx, `${pathPrefix}-${idx}`))
}

function walkNode(node: SerializedLexicalNode, ctx: RenderCtx, key: string): ReactNode {
  switch (node.type) {
    case 'linebreak':
      return <br key={key} />

    case 'tab':
      return <span key={key}>&nbsp;&nbsp;</span>

    case 'text': {
      const textNode = node as SerializedTextNode
      const content: ReactNode = textNode.text
      return <span key={key}>{applyTextFormat(textNode.format, content, ctx)}</span>
    }

    case 'paragraph': {
      const paraNode = node as SerializedParagraphNode
      const children = walkNodes(paraNode.children ?? [], ctx, key)
      return (
        <p key={key} className={ctx.classes.paragraph}>
          {children}
        </p>
      )
    }

    case 'heading': {
      const headingNode = node as SerializedHeadingNode
      const children = walkNodes(headingNode.children ?? [], ctx, key)
      const Tag = headingNode.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag key={key} className={ctx.classes.heading}>
          {children}
        </Tag>
      )
    }

    case 'quote': {
      const quoteNode = node as SerializedQuoteNode
      const children = walkNodes(quoteNode.children ?? [], ctx, key)
      return (
        <blockquote key={key} className={ctx.classes.quote}>
          {children}
        </blockquote>
      )
    }

    case 'list': {
      const listNode = node as SerializedListNode
      const children = walkNodes(listNode.children ?? [], ctx, key)
      if (listNode.listType === 'number') {
        return (
          <ol key={key} className={ctx.classes.listNumber}>
            {children}
          </ol>
        )
      }
      return (
        <ul key={key} className={ctx.classes.listBullet}>
          {children}
        </ul>
      )
    }

    case 'listitem': {
      const liNode = node as SerializedListItemNode
      const children = walkNodes(liNode.children ?? [], ctx, key)
      return <li key={key}>{children}</li>
    }

    case 'link': {
      const linkNode = node as SerializedLinkNode
      const children = walkNodes(linkNode.children ?? [], ctx, key)
      return (
        <a
          key={key}
          href={linkNode.url}
          target="_blank"
          rel="noopener noreferrer"
          className={ctx.classes.link}
        >
          {children}
        </a>
      )
    }

    case 'code': {
      const codeNode = node as SerializedCodeNode
      // Aggregate text from children: text/code-highlight nodes join as text, linebreak nodes become '\n'
      const codeText = aggregateCodeText(codeNode.children ?? [])
      const CodeComp = ctx.components.code
      if (CodeComp) {
        return <CodeComp key={key} code={codeText} language={codeNode.language} />
      }
      return (
        <pre key={key} className={ctx.classes.codeBlock} data-code-block>
          <code>{codeText}</code>
        </pre>
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
      const mentionNode = node as SerializedMentionNode & LegacySerializedMentionNode
      const { targetId, targetType, label } = resolveMention(mentionNode)
      const displayName = targetType === 'person' ? ctx.membersById?.[targetId]?.name : undefined
      const Mention = ctx.components.mention ?? MentionRender
      return (
        <Mention
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
        return <span key={key}>{walkNodes(unknown.children, ctx, key)}</span>
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

/**
 * Render a stored Lexical `SerializedEditorState` to React nodes.
 *
 * Headless across apps: ships sensible default Tailwind classes (override via
 * `opts.classes`) and a plain code block (override via `opts.components.code`).
 */
export function renderLexical(
  state: SerializedEditorState,
  opts: RenderLexicalOpts = {},
): ReactNode {
  const ctx: RenderCtx = {
    classes: { ...DEFAULT_RENDER_CLASSES, ...opts.classes },
    components: opts.components ?? {},
    membersById: opts.membersById,
  }
  try {
    const root = state.root as SerializedRichTextRoot
    if (!root || !Array.isArray(root.children)) {
      console.warn('[renderLexical] Invalid root node structure')
      return <span className={ctx.classes.error}>[Malformed message]</span>
    }
    const children = walkNodes(root.children, ctx, 'root')
    return <>{children}</>
  } catch (err) {
    console.warn('[renderLexical] Failed to render editor state:', err)
    return <span className={ctx.classes.error}>[Malformed message]</span>
  }
}
