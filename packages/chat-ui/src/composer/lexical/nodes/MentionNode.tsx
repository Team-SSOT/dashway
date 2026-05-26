import { getRichTextMentionId, normalizeRichTextMentionType } from '@dashway/app-protocol'
import { cn } from '@dashway/ui'
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import type { MentionTarget, MentionTargetType } from '../../types'

export type SerializedMentionNode = Spread<
  {
    type: 'mention'
    appId?: string
    mentionType?: MentionTargetType
    memberId?: string
    fileId?: string
    label?: string
    resourceType?: string
    resourceId?: string
    targetType?: string
    targetId?: string
    text: string
    version: 1
  },
  SerializedLexicalNode
>

const TYPE_CLASSES: Record<MentionTargetType, string> = {
  PERSON: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  FILE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
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
          TYPE_CLASSES[this.__target.type] ?? DEFAULT_TYPE_CLASS,
        )}
        data-mention-id={getRichTextMentionId(this.__target)}
        data-mention-type={this.__target.type}
        data-mention-app-id={this.__target.appId}
        data-mention-member-id={this.__target.type === 'PERSON' ? this.__target.memberId : undefined}
        data-mention-file-id={this.__target.type === 'FILE' ? this.__target.fileId : undefined}
      >
        @{this.__target.label}
      </span>
    )
  }

  exportJSON(): SerializedMentionNode {
    const mentionId =
      this.__target.type === 'PERSON'
        ? { memberId: this.__target.memberId }
        : { fileId: this.__target.fileId }

    return {
      type: 'mention',
      version: 1,
      appId: this.__target.appId,
      mentionType: this.__target.type,
      ...mentionId,
      label: this.__target.label,
      text: `@${this.__target.label}`,
    }
  }

  static importJSON(json: SerializedMentionNode): MentionNode {
    const mentionType = normalizeRichTextMentionType(
      json.mentionType ?? json.resourceType ?? json.targetType,
    )
    const mentionIdValue =
      mentionType === 'PERSON'
        ? json.memberId ?? json.resourceId ?? json.targetId ?? ''
        : json.fileId ?? json.resourceId ?? json.targetId ?? json.memberId ?? ''
    const label = json.label ?? json.text?.replace(/^@/, '') ?? mentionIdValue
    if (mentionType === 'PERSON') {
      return new MentionNode({
        appId: json.appId ?? 'context-api',
        type: 'PERSON',
        memberId: mentionIdValue,
        label,
      })
    }
    return new MentionNode({
      appId: json.appId ?? 'unknown',
      type: 'FILE',
      fileId: mentionIdValue,
      label,
    })
  }
}

export function $createMentionNode(target: MentionTarget): MentionNode {
  return new MentionNode(target)
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode
}
