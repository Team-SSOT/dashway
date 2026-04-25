import { cn } from '@dashway/ui'
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import type { MentionTarget, MentionTargetType } from '../../types'

export type SerializedMentionNode = Spread<
  {
    type: 'mention'
    targetType: MentionTargetType
    targetId: string
    label: string
    source?: string
    iconUrl?: string
    url?: string
    text: string
    version: 1
  },
  SerializedLexicalNode
>

const TYPE_CLASSES: Record<MentionTargetType, string> = {
  person: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

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

  decorate(): ReactNode {
    return (
      <span
        className={cn(
          'inline-flex max-w-[16rem] items-center rounded px-1 align-baseline font-medium',
          TYPE_CLASSES[this.__target.type],
        )}
        data-mention-id={this.__target.id}
        data-mention-type={this.__target.type}
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
