import { fromSearchFn, type MentionSearchProvider } from '@dashway/rich-text'
import type { SerializedEditorState } from 'lexical'
import { useCallback, useMemo, useRef } from 'react'
import { useDirectory } from '@/app/providers/DataSourceProvider'
import {
  type ComposerSendPayload,
  type MentionQuery,
  UniversalMessageComposer,
} from '@/features/composer/ui'
import type { MessageAttachment, RoomId } from '@/types/chat'
import { useDraft } from '../hooks/useDraft'
import { buildMentionTargets } from '../mock/mockMentionTargets'

interface Props {
  roomId: RoomId
  onSend: (
    content: SerializedEditorState,
    plainText: string,
    attachments?: MessageAttachment[],
  ) => void | Promise<void>
  placeholder?: string
}

// The composer-UI module revokes its preview blob URLs right after onSend, so we
// keep the source File around and mint message-owned blob URLs at send time.
const fileKey = (name: string, size: number) => `${name}|${size}`

export function MessageComposer({
  roomId,
  onSend,
  placeholder = 'Message this channel...',
}: Props) {
  const directory = useDirectory()
  const { savedDraft, debouncedSave } = useDraft(roomId)
  const fileCacheRef = useRef<Map<string, File>>(new Map())

  // Canonical mention-search injection seam (Principle 3): the provider is the
  // single swap-point. Swapping to a future ContextApiMentionSearchProvider is a
  // one-line change here; the composer's `mentionSearch` prop stays a function.
  const mentionProvider: MentionSearchProvider = useMemo(
    () =>
      fromSearchFn(({ query, limit }) =>
        buildMentionTargets(directory, { query, limit: limit ?? 8 }),
      ),
    [directory],
  )

  const mentionSearch = useCallback(
    (query: MentionQuery) => mentionProvider.search(query),
    [mentionProvider],
  )

  const handleFilesSelected = useCallback((files: File[]) => {
    for (const f of files) {
      fileCacheRef.current.set(fileKey(f.name, f.size), f)
    }
  }, [])

  const handleSend = useCallback(
    (payload: ComposerSendPayload) => {
      const attachments: MessageAttachment[] = payload.attachments.map((att) => {
        const cached = fileCacheRef.current.get(fileKey(att.name, att.size))
        const url = cached ? URL.createObjectURL(cached) : att.previewUrl
        if (cached) fileCacheRef.current.delete(fileKey(att.name, att.size))
        return {
          id: att.id,
          name: att.name,
          size: att.size,
          mimeType: att.mimeType,
          url,
        }
      })
      return onSend(
        payload.content,
        payload.plainText,
        attachments.length > 0 ? attachments : undefined,
      )
    },
    [onSend],
  )

  return (
    <UniversalMessageComposer
      composerId={`composer-${roomId}`}
      initialState={savedDraft}
      mentionSearch={mentionSearch}
      onDraftChange={debouncedSave}
      onFilesSelected={handleFilesSelected}
      onSend={handleSend}
      placeholder={placeholder}
    />
  )
}
