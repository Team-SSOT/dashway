import { Button, cn } from '@dashway/ui'
import type { LinkMatcher } from '@lexical/link'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import { LexicalComposer as LexicalComposerProvider } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
  $getRoot,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type EditorState,
  KEY_ENTER_COMMAND,
  type SerializedEditorState,
} from 'lexical'
import { File as FileIcon, FileText, Image, Paperclip, Plus, Send, X } from 'lucide-react'
import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditorConfig } from './lexical/editorConfig'
import { CHAT_TRANSFORMERS } from './lexical/markdownTransformers'
import { EmojiReplacePlugin } from './lexical/plugins/EmojiReplacePlugin'
import { ImeGuardPlugin } from './lexical/plugins/ImeGuardPlugin'
import { MentionTypeaheadPlugin } from './lexical/plugins/MentionTypeaheadPlugin'
import { PasteSanitizerPlugin } from './lexical/plugins/PasteSanitizerPlugin'
import type { ComposerAttachment, ComposerSendPayload, MentionQuery, MentionTarget } from './types'

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

export interface UniversalMessageComposerProps {
  composerId: string
  initialState?: SerializedEditorState
  placeholder?: string
  autoFocus?: boolean
  mentionSearch: (query: MentionQuery) => Promise<MentionTarget[]>
  onDraftChange?: (state: SerializedEditorState | null) => void
  onFilesSelected?: (files: File[]) => void
  onSend: (payload: ComposerSendPayload) => void | Promise<void>
}

export function UniversalMessageComposer({
  composerId,
  initialState,
  placeholder = 'Message this channel...',
  autoFocus = true,
  mentionSearch,
  onDraftChange,
  onFilesSelected,
  onSend,
}: UniversalMessageComposerProps) {
  const initialConfig = useMemo(() => createEditorConfig(composerId), [composerId])

  return (
    <LexicalComposerProvider key={composerId} initialConfig={initialConfig}>
      <InnerComposer
        composerId={composerId}
        initialState={initialState}
        placeholder={placeholder}
        autoFocus={autoFocus}
        mentionSearch={mentionSearch}
        onDraftChange={onDraftChange}
        onFilesSelected={onFilesSelected}
        onSend={onSend}
      />
    </LexicalComposerProvider>
  )
}

function InnerComposer({
  composerId,
  initialState,
  placeholder,
  autoFocus,
  mentionSearch,
  onDraftChange,
  onFilesSelected,
  onSend,
}: UniversalMessageComposerProps) {
  const [editor] = useLexicalComposerContext()
  const composingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentsRef = useRef<ComposerAttachment[]>([])
  const dragDepthRef = useRef(0)
  const initialStateRef = useRef(initialState)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  useEffect(() => {
    const state = initialStateRef.current
    if (!state) return
    try {
      editor.setEditorState(editor.parseEditorState(state))
    } catch (err) {
      console.warn('[UniversalMessageComposer] draft restore failed', err)
    }
  }, [composerId, editor])

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      })
    }
  }, [])

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      onFilesSelected?.(files)
      const next = files.map((file) => ({
        id: makeId('file'),
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: 'mock-ready' as const,
      }))
      setAttachments((current) => [...current, ...next])
      setToastMsg('Mock upload ready')
    },
    [onFilesSelected],
  )

  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return current.filter((attachment) => attachment.id !== id)
    })
  }, [])

  const buildPayload = useCallback((): ComposerSendPayload | null => {
    let plainText = ''
    let content: SerializedEditorState | null = null
    editor.getEditorState().read(() => {
      plainText = $getRoot().getTextContent()
      content = editor.getEditorState().toJSON()
    })
    if (content == null) return null
    if (plainText.trim().length === 0 && attachments.length === 0) return null
    return {
      content,
      plainText,
      mentions: extractMentions(content),
      attachments,
    }
  }, [attachments, editor])

  const clearComposer = useCallback(() => {
    editor.update(() => {
      $getRoot().clear()
    })
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
    onDraftChange?.(null)
    setAttachments((current) => {
      current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      })
      return []
    })
  }, [editor, onDraftChange])

  const sendCurrentMessage = useCallback(() => {
    const payload = buildPayload()
    if (!payload) return
    void onSend(payload)
    clearComposer()
  }, [buildPayload, clearComposer, onSend])

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!(event instanceof KeyboardEvent)) return false
        if (event.shiftKey) return false
        if (composingRef.current) return true

        const payload = buildPayload()
        if (!payload) {
          event.preventDefault()
          return true
        }

        event.preventDefault()
        void onSend(payload)
        clearComposer()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [buildPayload, clearComposer, editor, onSend])

  const handleChange = useCallback(
    (state: EditorState) => {
      const plainText = state.read(() => $getRoot().getTextContent())
      onDraftChange?.(plainText.trim().length === 0 ? null : state.toJSON())
    },
    [onDraftChange],
  )

  const resetFileDrag = useCallback(() => {
    dragDepthRef.current = 0
    setIsDraggingFiles(false)
  }, [])

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    dragDepthRef.current += 1
    setIsDraggingFiles(true)
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDraggingFiles(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDraggingFiles(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(event.dataTransfer)) return
      event.preventDefault()
      const files = Array.from(event.dataTransfer.files)
      resetFileDrag()
      addFiles(files)
    },
    [addFiles, resetFileDrag],
  )

  return (
    <div
      className={cn(
        'relative flex flex-col border-t border-border bg-background transition-colors',
        isDraggingFiles && 'bg-accent/20',
      )}
      data-file-drag-active={isDraggingFiles ? 'true' : 'false'}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={resetFileDrag}
      onDrop={handleDrop}
    >
      {isDraggingFiles ? (
        <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-md border-2 border-dashed border-ring/80 bg-background/70 text-ring shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-full border border-ring/40 bg-background shadow-sm">
            <Plus className="size-5" aria-hidden="true" />
            <span className="sr-only">Drop files to attach</span>
          </span>
        </div>
      ) : null}
      {toastMsg ? (
        <div className="px-3 pt-2 text-xs text-muted-foreground" role="status">
          {toastMsg}
        </div>
      ) : null}
      <AttachmentTray attachments={attachments} onRemove={removeAttachment} />
      <div className="relative flex items-end gap-2 px-3 py-2">
        <div className="relative flex-1">
          <MentionTypeaheadPlugin mentionSearch={mentionSearch} />
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
          {autoFocus ? <AutoFocusPlugin /> : null}
          <LinkPlugin />
          <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={CHAT_TRANSFORMERS} />
          <ImeGuardPlugin composingRef={composingRef} />
          <EmojiReplacePlugin />
          <PasteSanitizerPlugin
            onFilesPasted={addFiles}
            onImagePasteBlocked={() => setToastMsg('Image paste is shown as a mock attachment')}
            onCharLimitExceeded={() => setToastMsg('Message too long (max 50,000 chars)')}
          />
        </div>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          multiple
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
        >
          <Paperclip className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={sendCurrentMessage}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function AttachmentTray({
  attachments,
  onRemove,
}: {
  attachments: ComposerAttachment[]
  onRemove: (id: string) => void
}) {
  if (attachments.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto px-3 pt-2">
      {attachments.map((attachment) => {
        const isImage = attachment.mimeType.startsWith('image/')
        const Icon = isImage ? Image : attachment.mimeType.includes('pdf') ? FileText : FileIcon
        return (
          <div
            key={attachment.id}
            className="flex min-w-56 max-w-72 items-center gap-2 rounded-md border border-border bg-card px-2 py-2 text-card-foreground"
          >
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt=""
                className="size-10 rounded border border-border object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{attachment.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {formatBytes(attachment.size)} · mock ready
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.name}`}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function extractMentions(state: SerializedEditorState): MentionTarget[] {
  const mentions = new Map<string, MentionTarget>()
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const value = node as {
      type?: string
      appId?: string
      resourceType?: MentionTarget['resourceType']
      resourceId?: string
      targetType?: MentionTarget['resourceType']
      targetId?: string
      memberId?: string
      id?: string
      label?: string
      description?: string
      iconUrl?: string
      url?: string
      children?: unknown[]
    }
    if (value.type === 'mention') {
      const resourceType = value.resourceType ?? value.targetType ?? 'resource'
      const resourceId = value.resourceId ?? value.targetId ?? value.memberId ?? value.id
      const appId = value.appId ?? 'unknown'
      const label = value.label ?? resourceId
      if (resourceId && label) {
        mentions.set(`${appId}:${resourceType}:${resourceId}`, {
          appId,
          resourceType,
          resourceId,
          label,
          description: value.description,
          iconUrl: value.iconUrl,
          url: value.url,
        })
      }
    }
    value.children?.forEach(visit)
  }

  visit(state.root)
  return [...mentions.values()]
}

function makeId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isFileDrag(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes('Files') ?? false
}
