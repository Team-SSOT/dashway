import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'
import { Loader2, Search } from 'lucide-react'
import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { MentionTarget } from '../../types'
import { insertMentionAtCapturedRange } from '../mention/insertMention'
import { MentionResultList, type MentionResultListProps } from '../mention/MentionResultList'
import type { MentionCapturedRange, MentionQuery } from '../mention/types'

const MENTION_MATCH = /(^|\s)@([\p{L}\p{N}_./#-]*)$/u

interface Props {
  mentionSearch: (query: MentionQuery) => Promise<MentionTarget[]>
  /** Override the result-list UI (defaults to the package `MentionResultList`). */
  resultRenderer?: (props: MentionResultListProps) => ReactNode
}

export function MentionTypeaheadPlugin({ mentionSearch, resultRenderer }: Props) {
  const [editor] = useLexicalComposerContext()
  const listboxId = useId()
  const [capture, setCapture] = useState<MentionCapturedRange | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<MentionTarget[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const captureRef = useRef<MentionCapturedRange | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const preserveForInputRef = useRef(false)
  const requestIdRef = useRef(0)

  const isOpen = capture !== null

  const closePicker = useCallback(() => {
    captureRef.current = null
    preserveForInputRef.current = false
    setCapture(null)
    setSearchQuery('')
    setItems([])
    setActiveIndex(0)
    setLoading(false)
  }, [])

  const updateCapture = useCallback((nextCapture: MentionCapturedRange) => {
    const current = captureRef.current
    const sameRange =
      current?.textNodeKey === nextCapture.textNodeKey &&
      current.tokenStartOffset === nextCapture.tokenStartOffset &&
      current.tokenEndOffset === nextCapture.tokenEndOffset &&
      current.tokenText === nextCapture.tokenText

    captureRef.current = nextCapture
    setCapture(nextCapture)
    setSearchQuery(nextCapture.query)
    if (!sameRange) setActiveIndex(0)
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (preserveForInputRef.current || document.activeElement === inputRef.current) return

        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          closePicker()
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          closePicker()
          return
        }

        const beforeCaret = node.getTextContent().slice(0, anchor.offset)
        const match = MENTION_MATCH.exec(beforeCaret)
        if (!match) {
          closePicker()
          return
        }

        const tokenStartOffset = beforeCaret.lastIndexOf('@')
        updateCapture({
          textNodeKey: node.getKey(),
          tokenStartOffset,
          tokenEndOffset: anchor.offset,
          tokenText: beforeCaret.slice(tokenStartOffset, anchor.offset),
          query: match[2],
        })
      })
    })
  }, [closePicker, editor, updateCapture])

  useEffect(() => {
    if (!isOpen) {
      setItems([])
      setActiveIndex(0)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    const timer = window.setTimeout(() => {
      mentionSearch({ query: searchQuery, limit: 8 })
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
  }, [isOpen, mentionSearch, searchQuery])

  const insertMention = useCallback(
    (target: MentionTarget) => {
      const currentCapture = captureRef.current
      const inserted = currentCapture
        ? insertMentionAtCapturedRange(editor, currentCapture, target)
        : false

      if (!inserted) {
        console.warn('[MentionTypeahead] stale mention range; no-op')
      }

      closePicker()
      editor.focus()
    },
    [closePicker, editor],
  )

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((value) => {
        if (items.length === 0) return 0
        return (value + delta + items.length) % items.length
      })
    },
    [items.length],
  )

  const selectActive = useCallback(() => {
    const target = items[activeIndex]
    if (!target) return
    insertMention(target)
  }, [activeIndex, insertMention, items])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return

      if (event.key === 'ArrowDown') {
        if (items.length === 0) return
        event.preventDefault()
        moveActive(1)
      } else if (event.key === 'ArrowUp') {
        if (items.length === 0) return
        event.preventDefault()
        moveActive(-1)
      } else if (event.key === 'Enter') {
        if (items.length === 0) return
        event.preventDefault()
        selectActive()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        closePicker()
        editor.focus()
      }
    },
    [closePicker, editor, items.length, moveActive, selectActive],
  )

  useEffect(() => {
    const handlers = [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0 || event?.isComposing) return false
          event?.preventDefault()
          moveActive(1)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0 || event?.isComposing) return false
          event?.preventDefault()
          moveActive(-1)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (!isOpen || items.length === 0 || event?.isComposing) return false
          event?.preventDefault()
          selectActive()
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (!isOpen || event?.isComposing) return false
          event?.preventDefault()
          closePicker()
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    ]

    return () => {
      handlers.forEach((unregister) => {
        unregister()
      })
    }
  }, [closePicker, editor, isOpen, items.length, moveActive, selectActive])

  if (!isOpen) return null

  // Render as a component (not a function call) so the result list keeps its own
  // hook scope — calling it inline would inline its hooks into this plugin.
  const ResultList = resultRenderer ?? MentionResultList

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[32rem]">
      <div className="flex h-10 items-center gap-2 rounded-t-md border border-border bg-popover px-3 text-popover-foreground shadow-xl">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            preserveForInputRef.current = true
          }}
          onMouseDown={() => {
            preserveForInputRef.current = true
          }}
          onBlur={(event) => {
            preserveForInputRef.current = false
            const nextTarget = event.relatedTarget
            if (
              nextTarget instanceof Node &&
              event.currentTarget.parentElement?.contains(nextTarget)
            ) {
              return
            }
            closePicker()
          }}
          placeholder="Search mentions..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search mentions"
          aria-controls={listboxId}
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : null}
      </div>
      <div className="-mt-px">
        <ResultList
          compact
          listboxId={listboxId}
          items={items}
          activeIndex={activeIndex}
          onSelect={insertMention}
          onActiveChange={setActiveIndex}
          emptyState={
            loading ? null : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No mention targets found
              </div>
            )
          }
        />
      </div>
    </div>
  )
}
