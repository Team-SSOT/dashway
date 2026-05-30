import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isTextNode,
  type LexicalEditor,
  type TextNode,
} from 'lexical'
import { $createMentionNode } from '../lexical/nodes/MentionNode'
import type { MentionCapturedRange, MentionTarget } from './types'

const MENTION_MATCH = /(^|\s)@([\p{L}\p{N}_./#-]*)$/u

export function insertMentionAtCurrentSelection(
  editor: LexicalEditor,
  target: MentionTarget,
): void {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      $insertNodes([$createMentionNode(target), $createTextNode(' ')])
      return
    }

    const anchor = selection.anchor
    const node = anchor.getNode()
    if (!$isTextNode(node)) {
      $insertNodes([$createMentionNode(target), $createTextNode(' ')])
      return
    }

    const text = node.getTextContent()
    const beforeCaret = text.slice(0, anchor.offset)
    const match = MENTION_MATCH.exec(beforeCaret)
    const mentionStart = match ? beforeCaret.lastIndexOf('@') : -1
    if (mentionStart < 0) {
      $insertNodes([$createMentionNode(target), $createTextNode(' ')])
      return
    }

    replaceTextNodeRangeWithMention(node, mentionStart, anchor.offset, target)
  })
}

export function insertMentionAtCapturedRange(
  editor: LexicalEditor,
  capture: MentionCapturedRange,
  target: MentionTarget,
): boolean {
  let inserted = false

  editor.update(() => {
    const node = $getNodeByKey(capture.textNodeKey)
    if (!$isTextNode(node)) return

    const text = node.getTextContent()
    if (
      capture.tokenStartOffset < 0 ||
      capture.tokenEndOffset <= capture.tokenStartOffset ||
      capture.tokenEndOffset > text.length
    ) {
      return
    }

    const currentToken = text.slice(capture.tokenStartOffset, capture.tokenEndOffset)
    if (currentToken !== capture.tokenText || !currentToken.startsWith('@')) return

    inserted = replaceTextNodeRangeWithMention(
      node,
      capture.tokenStartOffset,
      capture.tokenEndOffset,
      target,
    )
  })

  return inserted
}

function replaceTextNodeRangeWithMention(
  node: TextNode,
  startOffset: number,
  endOffset: number,
  target: MentionTarget,
): boolean {
  const text = node.getTextContent()
  if (startOffset < 0 || endOffset <= startOffset || endOffset > text.length) return false

  let currentNode = node
  if (startOffset > 0) {
    const parts = currentNode.splitText(startOffset)
    const afterBefore = parts[1]
    if (!afterBefore) return false
    currentNode = afterBefore
  }

  const mentionLength = endOffset - startOffset
  const currentText = currentNode.getTextContent()
  if (mentionLength > currentText.length) return false

  const matched =
    mentionLength < currentText.length ? currentNode.splitText(mentionLength)[0] : currentNode
  if (!matched) return false

  const mentionNode = $createMentionNode(target)
  const spacer = $createTextNode(' ')
  matched.replace(mentionNode)
  mentionNode.insertAfter(spacer)
  spacer.select()
  return true
}
