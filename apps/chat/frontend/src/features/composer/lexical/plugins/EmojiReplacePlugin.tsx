import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isTextNode, TextNode } from 'lexical'
import { $createEmojiNode } from '../nodes/EmojiNode'
import { EMOJI_MAP } from '../emojiMap'

const EMOJI_REGEX = /:([a-z0-9_+-]+):/g

/**
 * Safety-net TextNode transform that swaps `:shortcode:` into EmojiNodes even
 * when the markdown shortcut plugin misses (e.g., pastes or programmatic input).
 * The markdown transformer in `CHAT_TRANSFORMERS` handles live typing.
 * Transforms run to fixed point, so multiple matches converge across passes.
 */
export function EmojiReplacePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode) => {
      if (!$isTextNode(textNode)) return
      const text = textNode.getTextContent()
      if (!text.includes(':')) return

      const matches = [...text.matchAll(EMOJI_REGEX)].filter((m) => EMOJI_MAP[m[1]])
      if (matches.length === 0) return

      // Handle the first match; transform runs again on remainder until fixed point.
      const first = matches[0]
      const matchStart = first.index ?? 0
      const matchEnd = matchStart + first[0].length
      const shortcode = first[1]
      const char = EMOJI_MAP[shortcode]
      if (!char) return

      const before = text.slice(0, matchStart)

      let currentNode: TextNode = textNode
      if (before.length > 0) {
        const parts = currentNode.splitText(before.length)
        const afterBefore = parts[1]
        if (!afterBefore) return
        currentNode = afterBefore
      }
      const matchLen = matchEnd - matchStart
      const [matched] = currentNode.splitText(matchLen)
      if (!matched) return

      const emoji = $createEmojiNode(shortcode, char)
      matched.replace(emoji)
    })
  }, [editor])

  return null
}
