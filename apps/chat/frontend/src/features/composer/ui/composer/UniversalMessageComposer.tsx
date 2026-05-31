import { extractMentionTargets } from '@dashway/rich-text'
import { RichTextEditor, type RichTextEditorHandle } from '@dashway/rich-text/editor'
import { Button, cn } from '@dashway/ui'
import type { EditorState, SerializedEditorState } from 'lexical'
import { $getRoot } from 'lexical'
import { File as FileIcon, FileText, Image, Paperclip, Plus, Send, X } from 'lucide-react'
import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react'
import type { ComposerAttachment, ComposerSendPayload, MentionQuery, MentionTarget } from './types'

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

/**
 * Chat composer shell. The rich-text editing surface is the shared
 * `@dashway/rich-text/editor` `<RichTextEditor>`; this component owns only the
 * chat-specific chrome: attachments, drag-drop, toasts, and the send controls.
 */
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
  const editorRef = useRef<RichTextEditorHandle>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentsRef = useRef<ComposerAttachment[]>([])
  const dragDepthRef = useRef(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

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

  const clearComposer = useCallback(() => {
    editorRef.current?.clear()
    onDraftChange?.(null)
    setAttachments((current) => {
      current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      })
      return []
    })
  }, [onDraftChange])

  const submit = useCallback(
    (content: SerializedEditorState, plainText: string) => {
      if (plainText.trim().length === 0 && attachments.length === 0) return
      void onSend({
        content,
        plainText,
        mentions: extractMentionTargets(content.root),
        attachments,
      })
      clearComposer()
    },
    [attachments, clearComposer, onSend],
  )

  const sendCurrentMessage = useCallback(() => {
    const handle = editorRef.current
    if (!handle) return
    submit(handle.getSerializedState(), handle.getPlainText())
  }, [submit])

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
      {/* py-1.5 (6px) + 44px controls = 56px resting height, matching the chat
          sidebar's Settings footer so the bottom borders line up. */}
      <div className="relative flex items-end gap-2 px-3 py-1.5">
        <RichTextEditor
          ref={editorRef}
          namespace={composerId}
          initialState={initialState}
          autoFocus={autoFocus}
          ariaLabel="Message composer"
          mentionSearch={mentionSearch}
          onChange={handleChange}
          onSubmit={submit}
          onFilesPasted={addFiles}
          onImagePasteBlocked={() => setToastMsg('Image paste is shown as a mock attachment')}
          onCharLimitExceeded={() => setToastMsg('Message too long (max 50,000 chars)')}
          placeholder={
            <div className="pointer-events-none absolute left-3 top-[10px] text-sm text-muted-foreground">
              {placeholder}
            </div>
          }
        />
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
