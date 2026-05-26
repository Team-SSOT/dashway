import { normalizeRichTextMentionType, type RichTextMentionType } from '@dashway/app-protocol'
import type { ReactNode } from 'react'

export interface MentionRenderProps {
  appId?: string
  mentionId: string
  mentionType?: string
  label: string
  displayName?: string
}

const TYPE_CLASSES: Record<RichTextMentionType, string> = {
  PERSON: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  FILE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
}
const DEFAULT_TYPE_CLASS = 'bg-muted text-muted-foreground'

export function MentionRender({
  appId,
  mentionId,
  mentionType,
  label,
  displayName,
}: MentionRenderProps): ReactNode {
  const normalizedMentionType = normalizeRichTextMentionType(mentionType)

  return (
    <span
      className={`rounded px-1 font-medium ${TYPE_CLASSES[normalizedMentionType] ?? DEFAULT_TYPE_CLASS}`}
      data-mention-id={mentionId}
      data-mention-type={normalizedMentionType}
      data-mention-app-id={appId}
      data-mention-member-id={normalizedMentionType === 'PERSON' ? mentionId : undefined}
      data-mention-file-id={normalizedMentionType === 'FILE' ? mentionId : undefined}
    >
      @{displayName ?? label}
    </span>
  )
}
