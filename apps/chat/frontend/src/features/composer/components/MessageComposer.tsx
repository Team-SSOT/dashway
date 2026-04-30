import { useCallback, useRef } from 'react'
import {
  UniversalMessageComposer,
  type ComposerSendPayload,
} from '@dashway/chat-ui'
import type { SerializedEditorState } from 'lexical'
import type { MessageAttachment, RoomId } from '@/types/chat'
import { useDraft } from '../hooks/useDraft'
import { searchMockMentionTargets } from '../mock/mockMentionTargets'

interface Props {
  roomId: RoomId
  onSend: (
    content: SerializedEditorState,
    plainText: string,
    attachments?: MessageAttachment[],
  ) => void | Promise<void>
  placeholder?: string
}

// chat-ui composer revokes its preview blob URLs right after onSend, so we keep
// the source File around and mint message-owned blob URLs at send time.
const fileKey = (name: string, size: number) => `${name}|${size}`

export function MessageComposer({ roomId, onSend, placeholder = 'Message this channel...' }: Props) {
  const { savedDraft, debouncedSave } = useDraft(roomId)
  const fileCacheRef = useRef<Map<string, File>>(new Map())

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
      return onSend(payload.content, payload.plainText, attachments.length > 0 ? attachments : undefined)
    },
    [onSend],
  )

  return (
    <UniversalMessageComposer
      composerId={`composer-${roomId}`}
      initialState={savedDraft}
      mentionSearch={searchMockMentionTargets}
      onDraftChange={debouncedSave}
      onFilesSelected={handleFilesSelected}
      onSend={handleSend}
      placeholder={placeholder}
    />
  )
}
