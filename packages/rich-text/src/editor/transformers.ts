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
  type TextMatchTransformer,
  type Transformer,
  UNORDERED_LIST,
} from '@lexical/markdown'
import { $createEmojiNode, $isEmojiNode, EmojiNode } from './emoji/EmojiNode'
import { DEFAULT_EMOJI_MAP } from './emoji/emojiMap'

/** Build the `:shortcode:` ↔ emoji text-match transformer against a given map. */
export function createEmojiTransformer(
  emojiMap: Record<string, string> = DEFAULT_EMOJI_MAP,
): TextMatchTransformer {
  return {
    dependencies: [EmojiNode],
    export: (node) => {
      if (!$isEmojiNode(node)) return null
      return `:${node.__shortcode}:`
    },
    importRegExp: /:([a-z0-9_+-]+):/,
    regExp: /:([a-z0-9_+-]+):$/,
    replace: (textNode, match) => {
      const shortcode = match[1]
      const char = emojiMap[shortcode]
      if (!char) return
      textNode.replace($createEmojiNode(shortcode, char))
    },
    trigger: ':',
    type: 'text-match',
  }
}

const BASE_TRANSFORMERS: Transformer[] = [
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
]

/** Standard rich-text markdown transformers + emoji shortcode support. */
export const RICH_TEXT_TRANSFORMERS: Transformer[] = [
  ...BASE_TRANSFORMERS,
  createEmojiTransformer(),
]

/** Build the transformer list with a custom emoji map. */
export function createRichTextTransformers(emojiMap?: Record<string, string>): Transformer[] {
  return [...BASE_TRANSFORMERS, createEmojiTransformer(emojiMap)]
}
