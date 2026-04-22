import type { ReactNode } from 'react'

export interface MentionRenderProps {
  memberId: string
  label: string
  displayName?: string
}

export function MentionRender({ memberId, label, displayName }: MentionRenderProps): ReactNode {
  return (
    <span
      className="rounded bg-primary/20 px-1 text-primary"
      data-mention-id={memberId}
    >
      @{displayName ?? label}
    </span>
  )
}
