import { EXCERPT_LIMIT } from './constants'
import type {
  ExtractedRichText,
  HighlightSpan,
  MentionRef,
  RichTextDocument,
  SerializedRichTextRoot,
} from './types'
import type { MentionTracker } from './tracker'

export interface ExtractOptions {
  /**
   * When supplied, `mentions` are taken from the tracker's O(1) cache instead of
   * being collected by a full tree walk. The full-walk mention collector
   * (`collectMentionsByWalk`) is then NOT invoked — this is the zero-walk editing
   * path asserted by AC3/AC9.
   */
  tracker?: MentionTracker
  /** Max characters of `plain` kept in `excerpt`. Defaults to EXCERPT_LIMIT (280). */
  excerptLimit?: number
}

/** Minimal structural view of a serialized Lexical node for read-only traversal. */
interface SerializedNodeLike {
  type?: unknown
  text?: unknown
  label?: unknown
  children?: unknown
}

// Block-level node types that contribute a trailing newline to plain text.
// Mirrors the chat-frontend `lexicalToPlain` rendering contract so extract().plain
// stays parity-compatible (asserted in Phase 2 / AC8b).
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listitem', 'quote'])

function asNode(value: unknown): SerializedNodeLike | undefined {
  return value && typeof value === 'object' ? (value as SerializedNodeLike) : undefined
}

function childrenOf(node: SerializedNodeLike): SerializedNodeLike[] {
  if (!Array.isArray(node.children)) return []
  const out: SerializedNodeLike[] = []
  for (const child of node.children) {
    const c = asNode(child)
    if (c) out.push(c)
  }
  return out
}

function mentionLabel(node: SerializedNodeLike): string {
  // Serialized mention text is already `@${label}` (MentionNode.exportJSON), but
  // fall back to label when a fixture omits it.
  if (typeof node.text === 'string') return node.text
  if (typeof node.label === 'string') return `@${node.label}`
  return '@'
}

/**
 * Single text-rendering walk. Produces `plain` and records the character offset of
 * every mention against the plain-text stream (used to derive highlightSlice).
 * This is the load/render pass, NOT the mention-tracking full walk; it always runs.
 */
function renderPlain(root: SerializedRichTextRoot): {
  plain: string
  mentionOffsets: Array<{ start: number; end: number }>
} {
  let plain = ''
  const mentionOffsets: Array<{ start: number; end: number }> = []

  const visit = (node: SerializedNodeLike): void => {
    const type = String(node.type)
    if (type === 'text') {
      plain += typeof node.text === 'string' ? node.text : ''
      return
    }
    if (type === 'mention') {
      const rendered = mentionLabel(node)
      const start = plain.length
      plain += rendered
      mentionOffsets.push({ start, end: plain.length })
      return
    }
    for (const child of childrenOf(node)) {
      visit(child)
    }
    if (BLOCK_TYPES.has(type)) {
      plain += '\n'
    }
  }

  for (const child of childrenOf(asNode(root) ?? {})) {
    visit(child)
  }

  return { plain: plain.replace(/\n+$/, ''), mentionOffsets }
}

/**
 * FULL-WALK mention collector (server / fixture path). Walks the entire document
 * tree to build the `MentionRef[]`. This is the branch a spy asserts is NOT called
 * when a tracker is supplied (AC3/AC9): on the tracker path we read the O(1) cache
 * via `tracker.values()` instead.
 */
function collectMentionsByWalk(root: SerializedRichTextRoot): MentionRef[] {
  const mentions: MentionRef[] = []

  const visit = (node: SerializedNodeLike): void => {
    if (String(node.type) === 'mention') {
      const anyNode = node as Record<string, unknown>
      mentions.push({
        id: String(anyNode.targetId ?? ''),
        type: anyNode.targetType as MentionRef['type'],
        label: String(anyNode.label ?? ''),
      })
      return
    }
    for (const child of childrenOf(node)) {
      visit(child)
    }
  }

  for (const child of childrenOf(asNode(root) ?? {})) {
    visit(child)
  }

  return mentions
}

/**
 * Build highlight spans within the excerpt. Mention offsets are computed against the
 * full plain stream; spans whose start falls inside the excerpt window are kept and
 * clamped to the excerpt boundary. Deterministic — fixture-tested by AC4b.
 */
function buildHighlightSlice(
  mentionOffsets: Array<{ start: number; end: number }>,
  mentions: MentionRef[],
  excerptLength: number,
): HighlightSpan[] {
  const slice: HighlightSpan[] = []
  const count = Math.min(mentionOffsets.length, mentions.length)
  for (let i = 0; i < count; i++) {
    const { start, end } = mentionOffsets[i]
    if (start >= excerptLength) continue
    slice.push({
      start,
      end: Math.min(end, excerptLength),
      refId: mentions[i].id,
    })
  }
  return slice
}

/**
 * Extract derived views (plain, excerpt, mentions, highlightSlice) from a serialized
 * RichTextDocument.
 *
 * - With `opts.tracker`: `mentions` come from the tracker's O(1) cache; the full-walk
 *   mention collector is skipped. Only the text-render walk runs (for plain/excerpt
 *   and deterministic highlight offsets).
 * - Without a tracker: a full walk collects mentions (server/fixture path).
 */
export function extract(doc: RichTextDocument, opts?: ExtractOptions): ExtractedRichText {
  const excerptLimit = opts?.excerptLimit ?? EXCERPT_LIMIT

  const { plain, mentionOffsets } = renderPlain(doc.root)
  const excerpt = plain.slice(0, excerptLimit)

  const mentions = opts?.tracker ? opts.tracker.values() : collectMentionsByWalk(doc.root)

  const highlightSlice = buildHighlightSlice(mentionOffsets, mentions, excerpt.length)

  return { plain, excerpt, mentions, highlightSlice }
}
