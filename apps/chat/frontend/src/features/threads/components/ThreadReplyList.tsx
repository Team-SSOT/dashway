import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { isSameDay } from 'date-fns'
import type { ChatMessage, ChatMember } from '@/types/chat'
import { MessageItem } from '@/features/messages/components/MessageItem'
import { DateDivider } from '@/features/messages/components/DateDivider'

const COMPACT_WINDOW_MS = 5 * 60 * 1000

interface Props {
  replies: ChatMessage[]
  members: ChatMember[]
}

/**
 * ThreadReplyList — a flat, non-virtualized reply list for ThreadPanel.
 *
 * Threads rarely exceed 100 replies in practice; we trade virtualization for
 * simplicity and correct bottom-anchor behavior when the composer sends.
 */
export function ThreadReplyList({ replies, members }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  // Stick to bottom on new replies
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [replies.length])

  const rows: ReactNode[] = []
  let prev: ChatMessage | null = null
  for (const m of replies) {
    const prevDateDiffers =
      !prev || !isSameDay(new Date(prev.serverCreatedAt), new Date(m.serverCreatedAt))
    if (prevDateDiffers) {
      rows.push(<DateDivider key={`date-${m.id}`} iso={m.serverCreatedAt} />)
    }
    const compact =
      !!prev &&
      !prevDateDiffers &&
      prev.authorId === m.authorId &&
      new Date(m.serverCreatedAt).getTime() - new Date(prev.serverCreatedAt).getTime() <
        COMPACT_WINDOW_MS
    rows.push(
      <MessageItem
        key={m.id}
        message={m}
        author={membersById[m.authorId]}
        membersById={membersById}
        compact={compact}
      />,
    )
    prev = m
  }

  return (
    <div ref={ref} role="log" aria-live="polite" className="flex-1 overflow-y-auto">
      {rows}
    </div>
  )
}
