import { cn } from '@dashway/ui'
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import type { MentionTarget, MentionTargetType } from '../../types'

export type SerializedMentionNode = Spread<
  {
    type: 'mention'
    appId: string
    resourceType: MentionTargetType
    resourceId: string
    label: string
    targetType?: MentionTargetType
    targetId?: string
    memberId?: string
    text: string
    version: 1
  },
  SerializedLexicalNode
>

const TYPE_CLASSES: Record<string, string> = {
  member: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}
const DEFAULT_TYPE_CLASS = 'bg-muted text-muted-foreground'

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
          TYPE_CLASSES[this.__target.resourceType] ?? DEFAULT_TYPE_CLASS,
        )}
        data-mention-id={this.__target.resourceId}
        data-mention-type={this.__target.resourceType}
        data-mention-app-id={this.__target.appId}
        data-mention-resource-id={this.__target.resourceId}
        data-mention-resource-type={this.__target.resourceType}
      >
        @{this.__target.label}
      </span>
    )
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      version: 1,
      appId: this.__target.appId,
      resourceType: this.__target.resourceType,
      resourceId: this.__target.resourceId,
      label: this.__target.label,
      text: `@${this.__target.label}`,
    }
  }

  static importJSON(json: SerializedMentionNode): MentionNode {
    const resourceType = json.resourceType ?? json.targetType ?? 'resource'
    const resourceId = json.resourceId ?? json.targetId ?? json.memberId ?? ''
    return new MentionNode({
      appId: json.appId ?? 'unknown',
      resourceType,
      resourceId,
      label: json.label,
    })
  }
}

export function $createMentionNode(target: MentionTarget): MentionNode {
  return new MentionNode(target)
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode
}
