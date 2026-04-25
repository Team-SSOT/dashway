import { useCallback } from 'react'
import {
  UniversalMessageComposer,
  type ComposerSendPayload,
} from '@dashway/chat-ui'
import type { SerializedEditorState } from 'lexical'
import type { RoomId } from '@/types/chat'
import { useDraft } from '../hooks/useDraft'
import { searchMockMentionTargets } from '../mock/mockMentionTargets'

interface Props {
  roomId: RoomId
  onSend: (content: SerializedEditorState, plainText: string) => void | Promise<void>
  placeholder?: string
}

export function MessageComposer({ roomId, onSend, placeholder = 'Message this channel...' }: Props) {
  const { savedDraft, debouncedSave } = useDraft(roomId)

  const handleSend = useCallback(
    (payload: ComposerSendPayload) => {
      if (payload.mentions.length > 0 || payload.attachments.length > 0) {
        console.info('[MessageComposer mock metadata]', {
          mentions: payload.mentions,
          attachments: payload.attachments.map(({ id, name, size, mimeType, status }) => ({
            id,
            name,
            size,
            mimeType,
            status,
          })),
        })
      }
      return onSend(payload.content, payload.plainText)
    },
    [onSend],
  )

  return (
    <UniversalMessageComposer
      composerId={`composer-${roomId}`}
      initialState={savedDraft}
      mentionSearch={searchMockMentionTargets}
      onDraftChange={debouncedSave}
      onFilesSelected={(files) => {
        console.info('[MessageComposer mock files selected]', files.map((file) => file.name))
      }}
      onSend={handleSend}
      placeholder={placeholder}
    />
  )
}
