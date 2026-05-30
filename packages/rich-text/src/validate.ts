import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_DEPTH, NODE_WHITELIST } from './constants'
import type { RichTextDocument } from './types'

export type ValidationErrorCode = 'size' | 'depth' | 'node'

export interface ValidationError {
  code: ValidationErrorCode
  message: string
  detail?: unknown
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

/** Minimal structural view of a serialized Lexical node for read-only traversal. */
interface SerializedNodeLike {
  type?: unknown
  children?: unknown
}

const WHITELIST = new Set<string>(NODE_WHITELIST)

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

/**
 * Validate a serialized RichTextDocument against size, depth, and node-type limits.
 *
 * NOTE: validate() is a DELIBERATE full tree walk on the load/save path. Like
 * `parseEditorState` (load) and `toJSON` (save), it is EXEMPT from Principle 1
 * (zero tree-walk), which governs the *editing* path only. Do NOT "optimize" this
 * onto the mention tracker — the tracker holds mentions only, not the whole tree,
 * and cannot answer depth/whitelist questions.
 */
export function validate(doc: RichTextDocument): ValidationResult {
  const errors: ValidationError[] = []

  // --- SIZE: measured in UTF-8 BYTES, not String.length. ---
  // UTF-16 .length undercounts Korean/CJK and emoji by ~3x, so a Korean document
  // could weigh ~750KB on the wire yet pass a `.length < 256K` check. This is a
  // Korean product; byte sizing is load-bearing.
  // TextEncoder (not Buffer) is used so the package needs no @types/node and works
  // identically in Node and the jsdom test runtime.
  const byteSize = new TextEncoder().encode(JSON.stringify(doc.root)).length
  if (byteSize > MAX_DOCUMENT_BYTES) {
    errors.push({
      code: 'size',
      message: `Document is ${byteSize} bytes, exceeds limit of ${MAX_DOCUMENT_BYTES} bytes`,
      detail: { byteSize, limit: MAX_DOCUMENT_BYTES },
    })
  }

  // --- DEPTH + NODE WHITELIST: single full walk. ---
  let maxDepth = 0
  const offending = new Set<string>()

  const visit = (node: SerializedNodeLike, depth: number): void => {
    if (depth > maxDepth) maxDepth = depth

    const type = typeof node.type === 'string' ? node.type : String(node.type)
    if (!WHITELIST.has(type)) {
      offending.add(type)
    }

    for (const child of childrenOf(node)) {
      visit(child, depth + 1)
    }
  }

  // The root itself is depth 0; its direct children start at depth 1.
  const root = asNode(doc.root)
  if (root) {
    for (const child of childrenOf(root)) {
      visit(child, 1)
    }
  }

  if (maxDepth > MAX_DOCUMENT_DEPTH) {
    errors.push({
      code: 'depth',
      message: `Document nesting depth ${maxDepth} exceeds limit of ${MAX_DOCUMENT_DEPTH}`,
      detail: { depth: maxDepth, limit: MAX_DOCUMENT_DEPTH },
    })
  }

  if (offending.size > 0) {
    const types = Array.from(offending)
    errors.push({
      code: 'node',
      message: `Document contains non-whitelisted node type(s): ${types.join(', ')}`,
      detail: { types },
    })
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
