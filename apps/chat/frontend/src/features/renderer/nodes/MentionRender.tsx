import type { RichTextMentionType } from '@dashway/app-protocol'
import type { ReactNode } from 'react'

export interface MentionRenderProps {
  targetId: string
  targetType?: RichTextMentionType
  label: string
  displayName?: string
  source?: string
}

const TYPE_CLASSES: Record<RichTextMentionType, string> = {
  person: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export function MentionRender({
  targetId,
  targetType = 'person',
  label,
  displayName,
  source,
}: MentionRenderProps): ReactNode {
  return (
    <span
      className={`rounded px-1 font-medium ${TYPE_CLASSES[targetType]}`}
      data-mention-id={targetId}
      data-mention-type={targetType}
      title={source}
    >
      @{displayName ?? label}
    </span>
  )
}
