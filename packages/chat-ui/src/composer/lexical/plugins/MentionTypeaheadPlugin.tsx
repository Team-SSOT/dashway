import { Button, cn } from '@dashway/ui'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'
import {
  AppWindow,
  CircleDot,
  FileText,
  Hash,
  Loader2,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MentionQuery, MentionTarget, MentionTargetType } from '../../types'
import { $createMentionNode } from '../nodes/MentionNode'

const MENTION_MATCH = /(^|\s)@([\p{L}\p{N}_./#-]*)$/u

interface Props {
  mentionSearch: (query: MentionQuery) => Promise<MentionTarget[]>
}

const TYPE_LABELS: Record<MentionTargetType, string> = {
  person: 'People',
  document: 'Docs',
  issue: 'Issues',
  team: 'Teams',
  app: 'Apps',
}

const TYPE_ICONS: Record<MentionTargetType, LucideIcon> = {
  person: User,
  document: FileText,
  issue: CircleDot,
  team: Users,
  app: AppWindow,
}

const TYPE_CLASSES: Record<MentionTargetType, string> = {
  person: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export function MentionTypeaheadPlugin({ mentionSearch }: Props) {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)
  const [items, setItems] = useState<MentionTarget[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)
  const queryRef = useRef<string | null>(null)

  const isOpen = query !== null

  const updateQuery = useCallback((nextQuery: string | null) => {
    if (queryRef.current === nextQuery) return
    queryRef.current = nextQuery
    setQuery(nextQuery)
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          updateQuery(null)
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          updateQuery(null)
          return
        }

        const beforeCaret = node.getTextContent().slice(0, anchor.offset)
        const match = MENTION_MATCH.exec(beforeCaret)
        updateQuery(match ? match[2] : null)
      })
    })
  }, [editor, updateQuery])

  useEffect(() => {
    if (query === null) {
      setItems([])
      setActiveIndex(0)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    const timer = window.setTimeout(() => {
      mentionSearch({ query, limit: 8 })
        .then((nextItems) => {
          if (requestId !== requestIdRef.current) return
          setItems(nextItems)
          setActiveIndex(0)
        })
        .catch((err) => {
          if (requestId !== requestIdRef.current) return
          console.warn('[MentionTypeahead] search failed', err)
          setItems([])
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false)
        })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [mentionSearch, query])

  const insertMention = useCallback(
    (target: MentionTarget) => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          $insertNodes([$createMentionNode(target), $createTextNode(' ')])
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          $insertNodes([$createMentionNode(target), $createTextNode(' ')])
          return
        }

        const text = node.getTextContent()
        const beforeCaret = text.slice(0, anchor.offset)
        const match = MENTION_MATCH.exec(beforeCaret)
        const mentionStart = match ? beforeCaret.lastIndexOf('@') : -1
        if (mentionStart < 0) {
          $insertNodes([$createMentionNode(target), $createTextNode(' ')])
          return
        }

        let currentNode = node
        if (mentionStart > 0) {
          const parts = currentNode.splitText(mentionStart)
          const afterBefore = parts[1]
          if (!afterBefore) return
          currentNode = afterBefore
        }

        const mentionLength = anchor.offset - mentionStart
        const [matched] = currentNode.splitText(mentionLength)
        if (!matched) return

        const mentionNode = $createMentionNode(target)
        const spacer = $createTextNode(' ')
        matched.replace(mentionNode)
        mentionNode.insertAfter(spacer)
        spacer.select()
      })
      updateQuery(null)
    },
    [editor, updateQuery],
  )

  useEffect(() => {
    const handlers = [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0) return false
          event?.preventDefault()
          setActiveIndex((value) => (value + 1) % items.length)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0) return false
          event?.preventDefault()
          setActiveIndex((value) => (value - 1 + items.length) % items.length)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0) return false
          event?.preventDefault()
          insertMention(items[activeIndex])
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (!isOpen) return false
          event?.preventDefault()
          updateQuery(null)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    ]

    return () => {
      handlers.forEach((unregister) => unregister())
    }
  }, [activeIndex, editor, insertMention, isOpen, items, updateQuery])

  const groupedItems = useMemo(() => {
    return items.reduce<Record<MentionTargetType, MentionTarget[]>>(
      (acc, item) => {
        acc[item.type].push(item)
        return acc
      },
      { person: [], document: [], issue: [], team: [], app: [] },
    )
  }, [items])

  if (!isOpen) return null

  let flatIndex = -1

  return (
    <div
      className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[32rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl"
      role="listbox"
      aria-label="Mention suggestions"
    >
      <div className="flex h-9 items-center gap-2 border-b border-border px-3 text-xs text-muted-foreground">
        <Hash className="size-3.5" />
        <span>{query ? `Search "${query}"` : 'Recent mentions'}</span>
        {loading ? <Loader2 className="ml-auto size-3.5 animate-spin" /> : null}
      </div>
      <div className="max-h-80 overflow-y-auto py-1">
        {items.length === 0 && !loading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No mention targets found
          </div>
        ) : null}
        {(Object.keys(groupedItems) as MentionTargetType[]).map((type) => {
          const group = groupedItems[type]
          if (group.length === 0) return null
          return (
            <div key={type} className="py-1">
              <div className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                {TYPE_LABELS[type]}
              </div>
              {group.map((item) => {
                flatIndex += 1
                const Icon = TYPE_ICONS[item.type]
                const selected = flatIndex === activeIndex
                return (
                  <Button
                    key={`${item.type}:${item.id}`}
                    type="button"
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-start rounded-none px-3 py-2 text-left',
                      selected && 'bg-accent text-accent-foreground',
                    )}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      insertMention(item)
                    }}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                        TYPE_CLASSES[item.type],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      {item.description ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    {item.source ? (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {item.source}
                      </span>
                    ) : null}
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
