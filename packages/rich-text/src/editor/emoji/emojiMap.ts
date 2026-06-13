/**
 * Default shortcode → emoji character map used by the emoji markdown transformer
 * and the `:shortcode:` replace plugin. Apps can override/extend it via the
 * `emojiMap` prop on `RichTextEditor` / `EmojiReplacePlugin`.
 */
export const DEFAULT_EMOJI_MAP: Record<string, string> = {
  smile: '😄',
  laugh: '😂',
  joy: '😂',
  tada: '🎉',
  rocket: '🚀',
  fire: '🔥',
  heart: '❤️',
  thumbs_up: '👍',
  white_check_mark: '✅',
  warning: '⚠️',
}
