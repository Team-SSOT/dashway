import { useEffect, useMemo, useRef } from 'react'
import type { SerializedEditorState } from 'lexical'
import { useUiStore } from '@/shared/store/uiStore'
import type { RoomId } from '@/types/chat'

/**
 * Draft persistence for the Lexical composer. Writes to uiStore with a 300ms
 * debounce to avoid thrashing the store on every keystroke. Pass `null` to
 * clear the draft (e.g. after send).
 */
export function useDraft(roomId: RoomId | undefined) {
  const drafts = useUiStore((s) => s.drafts)
  const setDraft = useUiStore((s) => s.setDraft)

  const savedDraft = useMemo(
    () => (roomId ? drafts[roomId] : undefined),
    [roomId, drafts],
  )

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSave = (state: SerializedEditorState | null) => {
    if (!roomId) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDraft(roomId, state)
      timerRef.current = null
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return { savedDraft, debouncedSave }
}
