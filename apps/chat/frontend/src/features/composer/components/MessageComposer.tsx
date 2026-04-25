import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LexicalComposer as LexicalComposerProvider } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import type { LinkMatcher } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type EditorState,
  type SerializedEditorState,
} from 'lexical'
import { Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import type { RoomId } from '@/types/chat'
import { createEditorConfig } from '../lexical/editorConfig'
import { CHAT_TRANSFORMERS } from '../lexical/markdownTransformers'
import { ImeGuardPlugin } from '../lexical/plugins/ImeGuardPlugin'
import { EmojiReplacePlugin } from '../lexical/plugins/EmojiReplacePlugin'
import { PasteSanitizerPlugin } from '../lexical/plugins/PasteSanitizerPlugin'
import { useDraft } from '../hooks/useDraft'

const URL_REGEX = /((?:https?:\/\/)[^\s]+)/

const AUTO_LINK_MATCHERS: LinkMatcher[] = [
  (text: string) => {
    const match = URL_REGEX.exec(text)
    if (!match) return null
    const full = match[0]
    return {
      index: match.index,
      length: full.length,
      text: full,
      url: full,
      attributes: { rel: 'noopener noreferrer', target: '_blank' },
    }
  },
]

interface Props {
  roomId: RoomId
  /** Called with the Lexical state snapshot + derived plainText. Host manages optimistic send + reset. */
  onSend: (content: SerializedEditorState, plainText: string) => void | Promise<void>
  placeholder?: string
}

export function MessageComposer({ roomId, onSend, placeholder = 'Message this channel…' }: Props) {
  const initialConfig = useMemo(() => createEditorConfig(`composer-${roomId}`), [roomId])

  // Key on roomId so the whole Lexical instance is recreated when the user
  // switches rooms; this keeps per-room drafts isolated.
  return (
    <LexicalComposerProvider key={roomId} initialConfig={initialConfig}>
      <InnerComposer roomId={roomId} onSend={onSend} placeholder={placeholder} />
    </LexicalComposerProvider>
  )
}

function InnerComposer({ roomId, onSend, placeholder }: Props) {
  const [editor] = useLexicalComposerContext()
  const { savedDraft, debouncedSave } = useDraft(roomId)
  const composingRef = useRef<boolean>(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Rehydrate draft when the room (and therefore the editor instance) mounts.
  useEffect(() => {
    if (!savedDraft) return
    try {
      editor.setEditorState(editor.parseEditorState(savedDraft))
    } catch (err) {
      console.warn('[MessageComposer] draft restore failed', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // Enter to send (IME-guarded)
  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!(event instanceof KeyboardEvent)) return false
        if (event.shiftKey) return false // newline
        if (composingRef.current) return true // swallow Enter during IME composition

        let plain = ''
        let json: SerializedEditorState | null = null
        editor.getEditorState().read(() => {
          plain = $getRoot().getTextContent()
          json = editor.getEditorState().toJSON()
        })
        if (plain.trim().length === 0 || json == null) {
          event.preventDefault()
          return true
        }

        event.preventDefault()
        void onSend(json, plain)
        editor.update(() => {
          $getRoot().clear()
        })
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
        debouncedSave(null)
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, onSend, debouncedSave])

  const handleChange = useCallback(
    (state: EditorState) => {
      const plain = state.read(() => $getRoot().getTextContent())
      if (plain.trim().length === 0) {
        debouncedSave(null)
      } else {
        debouncedSave(state.toJSON())
      }
    },
    [debouncedSave],
  )

  const handleSendClick = () => {
    let plain = ''
    let json: SerializedEditorState | null = null
    editor.getEditorState().read(() => {
      plain = $getRoot().getTextContent()
      json = editor.getEditorState().toJSON()
    })
    if (plain.trim().length === 0 || json == null) return
    void onSend(json, plain)
    editor.update(() => {
      $getRoot().clear()
    })
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
    debouncedSave(null)
  }

  return (
    <div className="flex flex-col border-t border-border bg-background">
      {toastMsg ? (
        <div
          role="alert"
          className="px-3 pt-2 text-xs text-destructive"
          onAnimationEnd={() => setToastMsg(null)}
        >
          {toastMsg}
        </div>
      ) : null}
      <div className="relative flex items-end gap-2 px-3 py-2">
        <div className="relative flex-1">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  'max-h-[40vh] min-h-[44px] overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring',
                )}
                aria-label="Message composer"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-3 top-[10px] text-sm text-muted-foreground">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          <AutoFocusPlugin />
          <LinkPlugin />
          <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={CHAT_TRANSFORMERS} />
          <ImeGuardPlugin composingRef={composingRef} />
          <EmojiReplacePlugin />
          <PasteSanitizerPlugin
            onImagePasteBlocked={() => setToastMsg('Image paste not supported yet')}
            onCharLimitExceeded={() => setToastMsg('Message too long (max 50,000 chars)')}
          />
        </div>
        <Button
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={handleSendClick}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
