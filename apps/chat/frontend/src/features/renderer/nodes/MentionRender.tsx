import type { RichTextResourceType } from '@dashway/app-protocol'
import type { ReactNode } from 'react'

export interface MentionRenderProps {
  appId?: string
  resourceId: string
  resourceType?: RichTextResourceType
  label: string
  displayName?: string
}

const TYPE_CLASSES: Record<string, string> = {
  member: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}
const DEFAULT_TYPE_CLASS = 'bg-muted text-muted-foreground'

export function MentionRender({
  appId,
  resourceId,
  resourceType = 'resource',
  label,
  displayName,
}: MentionRenderProps): ReactNode {
  return (
    <span
      className={`rounded px-1 font-medium ${TYPE_CLASSES[resourceType] ?? DEFAULT_TYPE_CLASS}`}
      data-mention-id={resourceId}
      data-mention-type={resourceType}
      data-mention-app-id={appId}
      data-mention-resource-id={resourceId}
      data-mention-resource-type={resourceType}
    >
      @{displayName ?? label}
    </span>
  )
}
