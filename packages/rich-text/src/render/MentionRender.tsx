import type { ReactNode } from 'react'
import type { MentionTargetType } from '../types'
import { MENTION_TYPE_CLASSES } from './mentionClasses'

export interface MentionRenderProps {
  targetId: string
  targetType?: MentionTargetType
  label: string
  displayName?: string
  source?: string
}

/** Default read-side mention chip. Override via `renderLexical`'s `components.mention`. */
export function MentionRender({
  targetId,
  targetType = 'person',
  label,
  displayName,
  source,
}: MentionRenderProps): ReactNode {
  return (
    <span
      className={`rounded px-1 font-medium ${MENTION_TYPE_CLASSES[targetType]}`}
      data-mention-id={targetId}
      data-mention-type={targetType}
      title={source}
    >
      @{displayName ?? label}
    </span>
  )
}
