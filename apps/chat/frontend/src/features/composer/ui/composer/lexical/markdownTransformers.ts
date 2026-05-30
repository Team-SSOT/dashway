import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CODE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  type TextMatchTransformer,
  type Transformer,
} from '@lexical/markdown'
import { EMOJI_MAP } from './emojiMap'
import { $createEmojiNode, $isEmojiNode, EmojiNode } from './nodes/EmojiNode'

const EMOJI_TRANSFORMER: TextMatchTransformer = {
  dependencies: [EmojiNode],
  export: (node) => {
    if (!$isEmojiNode(node)) return null
    return `:${node.__shortcode}:`
  },
  importRegExp: /:([a-z0-9_+-]+):/,
  regExp: /:([a-z0-9_+-]+):$/,
  replace: (textNode, match) => {
    const shortcode = match[1]
    const char = EMOJI_MAP[shortcode]
    if (!char) return
    textNode.replace($createEmojiNode(shortcode, char))
  },
  trigger: ':',
  type: 'text-match',
}

export const CHAT_TRANSFORMERS: Transformer[] = [
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  EMOJI_TRANSFORMER,
]
