import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'

export type SerializedEmojiNode = Spread<
  {
    type: 'emoji'
    shortcode: string
    char: string
    version: 1
  },
  SerializedLexicalNode
>

export class EmojiNode extends DecoratorNode<ReactNode> {
  __shortcode: string
  __char: string

  static getType(): string {
    return 'emoji'
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(node.__shortcode, node.__char, node.__key)
  }

  constructor(shortcode: string, char: string, key?: NodeKey) {
    super(key)
    this.__shortcode = shortcode
    this.__char = char
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    span.style.display = 'inline'
    return span
  }

  updateDOM(): false {
    return false
  }

  getTextContent(): string {
    return this.__char
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): true {
    return true
  }

  decorate(): ReactNode {
    return (
      <span role="img" aria-label={this.__shortcode}>
        {this.__char}
      </span>
    )
  }

  exportJSON(): SerializedEmojiNode {
    return {
      type: 'emoji',
      version: 1,
      shortcode: this.__shortcode,
      char: this.__char,
    }
  }

  static importJSON(json: SerializedEmojiNode): EmojiNode {
    return new EmojiNode(json.shortcode, json.char)
  }
}

export function $createEmojiNode(shortcode: string, char: string): EmojiNode {
  return new EmojiNode(shortcode, char)
}

export function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode {
  return node instanceof EmojiNode
}
