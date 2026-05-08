import { useMemo } from 'react'
import { currentUserId } from '@/data/mockData'
import { cn } from '@/shared/lib/cn'
import type { Reaction } from '@/types/chat'
import { useIsLive } from '@/app/featureFlags'

interface ChipSummary {
  emoji: string
  count: number
  reactedByMe: boolean
}

interface Props {
  reactions: Reaction[] | undefined
  onToggle: (emoji: string, hasMine: boolean) => void
}

function summarize(reactions: Reaction[] | undefined, viewerId: string): ChipSummary[] {
  if (!reactions || reactions.length === 0) return []
  return reactions
    .filter((r) => r.userIds.length > 0)
    .map((r) => ({
      emoji: r.emoji,
      count: r.userIds.length,
      reactedByMe: r.userIds.includes(viewerId),
    }))
}

export function ReactionChips({ reactions, onToggle }: Props) {
  const chips = useMemo(() => summarize(reactions, currentUserId), [reactions])
  const isLive = useIsLive()
  if (chips.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label="Reactions">
      {chips.map((chip) => (
        <button
          key={chip.emoji}
          type="button"
          onClick={() => !isLive && onToggle(chip.emoji, chip.reactedByMe)}
          disabled={isLive}
          aria-pressed={chip.reactedByMe}
          aria-label={`${chip.emoji} ${chip.count} ${chip.reactedByMe ? '— remove your reaction' : '— add your reaction'}`}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs leading-none transition-colors',
            chip.reactedByMe
              ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
              : 'border-border bg-muted/40 text-foreground hover:bg-muted/60',
            isLive && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className="text-sm leading-none">{chip.emoji}</span>
          <span className="tabular-nums">{chip.count}</span>
        </button>
      ))}
    </div>
  )
}

export const __test__ = { summarize }
