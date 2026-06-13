import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isTextNode, TextNode } from 'lexical'
import { useEffect } from 'react'
import { $createEmojiNode } from '../emoji/EmojiNode'
import { DEFAULT_EMOJI_MAP } from '../emoji/emojiMap'

const EMOJI_REGEX = /:([a-z0-9_+-]+):/g

interface Props {
  emojiMap?: Record<string, string>
}

export function EmojiReplacePlugin({ emojiMap = DEFAULT_EMOJI_MAP }: Props = {}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode) => {
      if (!$isTextNode(textNode)) return
      const text = textNode.getTextContent()
      if (!text.includes(':')) return

      const matches = [...text.matchAll(EMOJI_REGEX)].filter((m) => emojiMap[m[1]])
      if (matches.length === 0) return

      const first = matches[0]
      const matchStart = first.index ?? 0
      const matchEnd = matchStart + first[0].length
      const shortcode = first[1]
      const char = emojiMap[shortcode]
      if (!char) return

      const before = text.slice(0, matchStart)
      let currentNode: TextNode = textNode
      if (before.length > 0) {
        const parts = currentNode.splitText(before.length)
        const afterBefore = parts[1]
        if (!afterBefore) return
        currentNode = afterBefore
      }

      const [matched] = currentNode.splitText(matchEnd - matchStart)
      if (!matched) return
      matched.replace($createEmojiNode(shortcode, char))
    })
  }, [editor, emojiMap])

  return null
}
