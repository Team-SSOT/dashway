import type { LexicalEditor } from 'lexical'
import { useEffect, useState } from 'react'
import { createMentionTracker } from '../tracker'
import type { MentionRef } from '../types'

/**
 * Subscribe to the live set of mentions in an editor. Creates a `MentionTracker`
 * for the editor on mount, mirrors its `MentionRef[]` into React state, and tears
 * it down on unmount (or when the editor instance changes).
 *
 * The tracker populates from pre-existing mentions on registration
 * (skipInitialization=false), so the initial state reflects an already-loaded
 * document on the first commit after mount.
 */
export function useMentionTracker(editor: LexicalEditor): MentionRef[] {
  const [refs, setRefs] = useState<MentionRef[]>([])

  useEffect(() => {
    const tracker = createMentionTracker(editor)
    // Seed with any mentions populated during registration, then track changes.
    setRefs(tracker.values())
    const unsubscribe = tracker.subscribe(setRefs)

    return () => {
      unsubscribe()
      tracker.dispose()
    }
  }, [editor])

  return refs
}
