import type { SerializedEditorState } from 'lexical'

/** Convert plain text to a minimal Lexical SerializedEditorState (single paragraph). */
export function plainTextToLexical(s: string): SerializedEditorState {
  // Cast required: TS splits SerializedLexicalNode (leaf) from SerializedElementNode (children),
  // but runtime shape is valid for Lexical to consume.
  return {
    root: {
      children: [
        {
          children: s
            ? [{ detail: 0, format: 0, mode: 'normal' as const, style: '', text: s, type: 'text', version: 1 }]
            : [],
          direction: s ? ('ltr' as const) : null,
          format: '' as const,
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: s ? ('ltr' as const) : null,
      format: '' as const,
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as SerializedEditorState
}

/**
 * Extract plain text from a Lexical SerializedEditorState.
 * Mention nodes are rendered as "@{text}" — fidelity loss is expected and documented.
 * Full mention round-trip requires server-side mention resolution (V1.2+).
 */
export function lexicalToPlain(es: SerializedEditorState): string {
  function extractNode(node: Record<string, unknown>): string {
    if (node.type === 'text') return String(node.text ?? '')
    // Mention node: render as @text. Mention payload (memberId) is lost in plain text.
    if (node.type === 'mention') return `@${String(node.text ?? node.value ?? '')}`
    const children = node.children as Record<string, unknown>[] | undefined
    if (!children) return ''
    const childText = children.map(extractNode).join('')
    // Add newline after block-level nodes (paragraph, heading, listitem)
    const blockTypes = new Set(['paragraph', 'heading', 'listitem', 'quote'])
    return blockTypes.has(String(node.type)) ? childText + '\n' : childText
  }

  const root = es.root as unknown as Record<string, unknown>
  return extractNode(root).trimEnd()
}
