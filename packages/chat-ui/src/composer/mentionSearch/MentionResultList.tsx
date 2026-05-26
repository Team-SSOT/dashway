import { getRichTextMentionKey } from '@dashway/app-protocol'
import { Button, cn } from '@dashway/ui'
import { FileText, type LucideIcon, User } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import type { MentionTarget, MentionTargetType } from './types'

interface MentionResourceMeta {
  label: string
  icon: LucideIcon
  className: string
}

export const MENTION_RESOURCE_META: Record<MentionTargetType, MentionResourceMeta> = {
  PERSON: {
    label: 'People',
    icon: User,
    className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  FILE: {
    label: 'Files',
    icon: FileText,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
}

const DEFAULT_MENTION_RESOURCE_META: MentionResourceMeta = {
  label: 'Resources',
  icon: FileText,
  className: 'bg-muted text-muted-foreground',
}

function getMentionMeta(mentionType: MentionTargetType): MentionResourceMeta {
  return MENTION_RESOURCE_META[mentionType] ?? DEFAULT_MENTION_RESOURCE_META
}

export interface MentionResultListProps {
  items: MentionTarget[]
  activeIndex: number
  onSelect: (target: MentionTarget) => void
  onActiveChange: (index: number) => void
  compact?: boolean
  headerSlot?: ReactNode
  emptyState?: ReactNode
  listboxId?: string
}

export function MentionResultList({
  items,
  activeIndex,
  onSelect,
  onActiveChange,
  compact = false,
  headerSlot,
  emptyState,
  listboxId,
}: MentionResultListProps) {
  const groupedItems = useMemo(() => {
    const groups = new Map<MentionTargetType, MentionTarget[]>()
    for (const item of items) {
      const group = groups.get(item.type) ?? []
      group.push(item)
      groups.set(item.type, group)
    }
    return [...groups.entries()]
  }, [items])

  const containerClass = compact
    ? 'overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl'
    : 'overflow-hidden rounded-md border border-border bg-background text-foreground'

  const listClass = compact ? 'max-h-80 overflow-y-auto py-1' : 'max-h-[60vh] overflow-y-auto py-1'

  let flatIndex = -1

  return (
    <div className={containerClass}>
      {headerSlot}
      <div id={listboxId} className={listClass} role="listbox" aria-label="Mention suggestions">
        {items.length === 0
          ? (emptyState ?? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No mention targets found
              </div>
            ))
          : null}
        {groupedItems.map(([mentionType, group]) => {
          if (group.length === 0) return null
          const groupMeta = getMentionMeta(mentionType)
          return (
            <div key={mentionType} className="py-1">
              <div className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                {groupMeta.label}
              </div>
              {group.map((item) => {
                flatIndex += 1
                const itemMeta = getMentionMeta(item.type)
                const Icon = itemMeta.icon
                const itemIndex = flatIndex
                const selected = itemIndex === activeIndex
                return (
                  <Button
                    key={getRichTextMentionKey(item)}
                    type="button"
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-start rounded-none px-3 py-2 text-left',
                      selected && 'bg-accent text-accent-foreground',
                    )}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => onActiveChange(itemIndex)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onSelect(item)
                    }}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                        itemMeta.className,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {item.appId}
                    </span>
                  </Button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
