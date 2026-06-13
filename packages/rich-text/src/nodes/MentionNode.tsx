import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import type { MentionTarget, MentionTargetType, SerializedMentionNode } from '../types'

/**
 * Per-target-type class strings injected by the host app via Lexical's
 * `EditorThemeClasses` (`config.theme.mention`). The package stays headless: when
 * no `mention` theme is supplied, the node renders an unstyled, style-agnostic span
 * (only `data-mention-*` attributes), so non-app consumers and tests are unaffected.
 */
type MentionTheme = { base?: string } & Partial<Record<MentionTargetType, string>>

export class MentionNode extends DecoratorNode<ReactNode> {
  __target: MentionTarget

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__target, node.__key)
  }

  constructor(target: MentionTarget, key?: NodeKey) {
    super(key)
    this.__target = target
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
    return `@${this.__target.label}`
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): true {
    return true
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): ReactNode {
    const mentionTheme = (config.theme as { mention?: MentionTheme }).mention
    const className =
      [mentionTheme?.base, mentionTheme?.[this.__target.type]].filter(Boolean).join(' ') ||
      undefined
    return (
      <span
        className={className}
        data-mention-type={this.__target.type}
        data-mention-id={this.__target.id}
        data-mention-label={this.__target.label}
        title={this.__target.description}
      >
        @{this.__target.label}
      </span>
    )
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      version: 1,
      targetType: this.__target.type,
      targetId: this.__target.id,
      label: this.__target.label,
      source: this.__target.source,
      iconUrl: this.__target.iconUrl,
      url: this.__target.url,
      text: `@${this.__target.label}`,
    }
  }

  static importJSON(json: SerializedMentionNode): MentionNode {
    return new MentionNode({
      type: json.targetType,
      id: json.targetId,
      label: json.label,
      source: json.source,
      iconUrl: json.iconUrl,
      url: json.url,
    })
  }
}

export function $createMentionNode(target: MentionTarget): MentionNode {
  return new MentionNode(target)
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode
}
