import { createEditor, type LexicalEditor } from 'lexical'
import { $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot } from 'lexical'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { MentionNode, $createMentionNode } from '../../src/nodes/MentionNode'
import type { MentionTarget } from '../../src/types'

/**
 * Build a Lexical editor with the same node set the package targets, attached to
 * a jsdom contentEditable root.
 *
 * The root element is REQUIRED: Lexical dispatches MutationListener callbacks
 * during DOM reconciliation, which only runs once an editor has a root element.
 * A truly root-less ("headless") editor commits state updates but never fires
 * mutation listeners for live edits — so the tracker would stay empty. Registering
 * every whitelisted node type also lets fixtures round-trip through
 * `parseEditorState` without unregistered-node errors.
 */
export function createHeadlessEditor(): LexicalEditor {
  const editor = createEditor({
    namespace: 'rich-text-test',
    nodes: [
      MentionNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
    ],
    onError(error) {
      throw error
    },
  })
  const root = document.createElement('div')
  root.contentEditable = 'true'
  document.body.appendChild(root)
  editor.setRootElement(root)
  return editor
}

/**
 * Run an update and flush it discretely so mutation listeners fire synchronously
 * before the call returns — required for deterministic tracker assertions.
 */
export function updateDiscrete(editor: LexicalEditor, fn: () => void): void {
  editor.update(fn, { discrete: true })
}

/** Append a mention node (wrapped in a paragraph) and return its NodeKey. */
export function appendMention(editor: LexicalEditor, target: MentionTarget): string {
  let key = ''
  updateDiscrete(editor, () => {
    const paragraph = $createParagraphNode()
    const mention = $createMentionNode(target)
    paragraph.append(mention)
    $getRoot().append(paragraph)
    key = mention.getKey()
  })
  return key
}

/** Append a plain-text paragraph. */
export function appendParagraph(editor: LexicalEditor, text: string): void {
  updateDiscrete(editor, () => {
    const paragraph = $createParagraphNode()
    paragraph.append($createTextNode(text))
    $getRoot().append(paragraph)
  })
}

/** Remove the node with the given key. */
export function removeNode(editor: LexicalEditor, key: string): void {
  updateDiscrete(editor, () => {
    const node = $getNodeByKey(key)
    if (node) node.remove()
  })
}
