/**
 * MessageList — TanStack Virtual host (FE-M2).
 *
 * Responsibilities:
 *   - Build interleaved `rows`: date dividers + unread divider + messages.
 *     The virtualizer counts THESE rows, not raw messages.
 *   - Bottom-anchored: on mount + on "user-at-bottom + append", scroll to end.
 *   - Jump-to-bottom button: shows when scrolled up > 120px; one click returns.
 *   - Top-sentinel prepend: when first visible index < 5 AND hasNextPage, call
 *     fetchNextPage. Scroll anchor is preserved via scrollTop delta.
 *   - Dynamic heights via `measureElement`.
 *
 * The scroll anchor trick on prepend:
 *   When older messages are prepended at the TOP, the virtualizer's computed
 *   totalSize grows. If we do nothing the viewport shows different content at
 *   the same scrollTop. Fix: record totalSize BEFORE the page arrives, then
 *   after the page settles, set `scrollTop = newScrollTop + (newTotal - oldTotal)`.
 *   The virtualizer re-positions items to honor the new scrollTop.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { isSameDay } from 'date-fns'
import { ArrowDown, Loader2 } from 'lucide-react'
import type { ChatMember, ChatMessage, RoomId } from '@/types/chat'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { MessageItem } from './MessageItem'
import { DateDivider } from './DateDivider'
import { UnreadDivider } from './UnreadDivider'

interface Props {
  roomId: RoomId
  flatMessages: ChatMessage[]
  members: ChatMember[]
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  /** Current user's lastReadAt ISO for unread divider. Null = full unread. */
  lastReadAt?: string | null
}

type Row =
  | { type: 'loader'; key: string }
  | { type: 'date-divider'; key: string; iso: string }
  | { type: 'unread-divider'; key: string; count: number }
  | {
      type: 'message'
      key: string
      message: ChatMessage
      compact: boolean
      showAuthorHeader: boolean
    }

const COMPACT_WINDOW_MS = 5 * 60 * 1000
const BOTTOM_THRESHOLD_PX = 120
const TOP_SENTINEL_INDEX = 5
const ESTIMATED_ROW_HEIGHT = 60

export function MessageList({
  roomId,
  flatMessages,
  members,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  lastReadAt,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )

  // Messages come sorted asc; strip thread replies from channel view.
  const visible = useMemo(
    () => flatMessages.filter((m) => !m.threadParentId),
    [flatMessages],
  )

  // Pre-compute the unread insertion index (first message with
  // serverCreatedAt > lastReadAt) so we can interleave the divider cleanly.
  const unreadStartIdx = useMemo(() => {
    if (!lastReadAt) return -1
    const ts = new Date(lastReadAt).getTime()
    return visible.findIndex((m) => new Date(m.serverCreatedAt).getTime() > ts)
  }, [visible, lastReadAt])

  // Build interleaved rows
  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    if (hasNextPage) {
      out.push({ type: 'loader', key: '__top-loader' })
    }
    let prev: ChatMessage | null = null
    for (let i = 0; i < visible.length; i++) {
      const m = visible[i]
      const prevDateDiffers =
        !prev || !isSameDay(new Date(prev.serverCreatedAt), new Date(m.serverCreatedAt))
      if (prevDateDiffers) {
        out.push({
          type: 'date-divider',
          key: `date-${m.id}`,
          iso: m.serverCreatedAt,
        })
      }
      if (i === unreadStartIdx && unreadStartIdx > 0) {
        out.push({
          type: 'unread-divider',
          key: '__unread-divider',
          count: visible.length - unreadStartIdx,
        })
      }
      const sameDay =
        !!prev && isSameDay(new Date(prev.serverCreatedAt), new Date(m.serverCreatedAt))
      const compact =
        !!prev &&
        prev.authorId === m.authorId &&
        new Date(m.serverCreatedAt).getTime() - new Date(prev.serverCreatedAt).getTime() <
          COMPACT_WINDOW_MS &&
        sameDay &&
        prevDateDiffers === false
      out.push({
        type: 'message',
        key: m.id,
        message: m,
        compact,
        showAuthorHeader: !compact,
      })
      prev = m
    }
    return out
  }, [visible, unreadStartIdx, hasNextPage])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
    getItemKey: (i) => rows[i]?.key ?? i,
  })

  // ─── Bottom-anchor tracking ────────────────────────────────────────────────
  const [isAtBottom, setIsAtBottom] = useState(true)
  const isAtBottomRef = useRef(true)
  isAtBottomRef.current = isAtBottom
  const prevRowCountRef = useRef(rows.length)
  const prevLastIdRef = useRef<string | undefined>(undefined)

  const lastRowId =
    rows.length > 0 ? rows[rows.length - 1].key : undefined

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop
    setIsAtBottom(distanceFromBottom <= BOTTOM_THRESHOLD_PX)
  }

  // On first mount and whenever the LAST row changes AND user was at bottom,
  // stick to the new bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prevLastIdRef.current === undefined) {
      // First mount — force to bottom
      virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })
      prevLastIdRef.current = lastRowId
      prevRowCountRef.current = rows.length
      return
    }
    const lastChanged = prevLastIdRef.current !== lastRowId
    const grew = rows.length > prevRowCountRef.current
    if (lastChanged && grew && isAtBottomRef.current) {
      virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })
    }
    prevLastIdRef.current = lastRowId
    prevRowCountRef.current = rows.length
    // virtualizer dep omitted — its identity stays stable per container
  }, [lastRowId, rows.length, virtualizer])

  // ─── Top-sentinel prepend (older-history fetch) + anchor preservation ───────
  const prevTotalSizeRef = useRef<number>(0)
  const prependInFlightRef = useRef(false)

  const virtualItems = virtualizer.getVirtualItems()
  const firstVisibleIndex = virtualItems[0]?.index ?? 0

  useEffect(() => {
    if (!hasNextPage || !fetchNextPage) return
    if (isFetchingNextPage) return
    if (prependInFlightRef.current) return
    if (firstVisibleIndex > TOP_SENTINEL_INDEX) return
    prependInFlightRef.current = true
    prevTotalSizeRef.current = virtualizer.getTotalSize()
    fetchNextPage()
  }, [firstVisibleIndex, hasNextPage, isFetchingNextPage, fetchNextPage, virtualizer])

  // After isFetchingNextPage flips false AND rows.length grew, compute the
  // delta in totalSize and offset scrollTop so the visible content doesn't jump.
  useLayoutEffect(() => {
    if (!prependInFlightRef.current) return
    if (isFetchingNextPage) return
    const el = scrollRef.current
    if (!el) return
    const newTotal = virtualizer.getTotalSize()
    const delta = newTotal - prevTotalSizeRef.current
    if (delta > 0) {
      el.scrollTop = el.scrollTop + delta
    }
    prependInFlightRef.current = false
  }, [isFetchingNextPage, rows.length, virtualizer])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        onScroll={onScroll}
        className="h-full overflow-y-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((vi) => {
            const row = rows[vi.index]
            if (!row) return null
            return (
              <div
                key={row.key}
                data-index={vi.index}
                ref={(el) => virtualizer.measureElement(el)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {renderRow(row, membersById, isFetchingNextPage ?? false, roomId)}
              </div>
            )
          })}
        </div>
      </div>

      {!isAtBottom && rows.length > 0 ? (
        <Button
          type="button"
          variant="default"
          size="icon-sm"
          aria-label="Jump to latest messages"
          onClick={() => virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })}
          className={cn(
            'absolute bottom-4 right-4 shadow-lg rounded-full',
          )}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

function renderRow(
  row: Row,
  membersById: Record<string, ChatMember>,
  isFetchingNextPage: boolean,
  roomId: RoomId,
): React.ReactNode {
  switch (row.type) {
    case 'loader':
      return (
        <div className="flex items-center justify-center py-3 text-muted-foreground">
          {isFetchingNextPage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-xs">Scroll up to load older messages</span>
          )}
        </div>
      )
    case 'date-divider':
      return <DateDivider iso={row.iso} />
    case 'unread-divider':
      return <UnreadDivider count={row.count} />
    case 'message':
      return (
        <MessageItem
          message={row.message}
          author={membersById[row.message.authorId]}
          membersById={membersById}
          compact={row.compact}
          roomId={roomId}
        />
      )
  }
}
