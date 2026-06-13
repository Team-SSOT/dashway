import type { LinkMatcher } from '@lexical/link'
import type { Transformer } from '@lexical/markdown'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
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
  type Klass,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
} from 'lexical'
import {
  forwardRef,
  type ReactElement,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import type { MentionTarget } from '../types'
import { createEditorConfig, type EditorTheme } from './editorConfig'
import type { MentionResultListProps } from './mention/MentionResultList'
import type { MentionQuery } from './mention/types'
import { EmojiReplacePlugin } from './plugins/EmojiReplacePlugin'
import { ImeGuardPlugin } from './plugins/ImeGuardPlugin'
import { MentionTypeaheadPlugin } from './plugins/MentionTypeaheadPlugin'
import { PasteSanitizerPlugin } from './plugins/PasteSanitizerPlugin'
import { RICH_TEXT_TRANSFORMERS } from './transformers'

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

/** Imperative handle for app chrome to drive the editor (send button, clear, etc.). */
export interface RichTextEditorHandle {
  focus(): void
  clear(): void
  getEditor(): LexicalEditor
  /** Current document as serialized JSON (read inside the editor state). */
  getSerializedState(): SerializedEditorState
  /** Current plain-text content (mentions render as their text). */
  getPlainText(): string
}

export interface RichTextEditorProps {
  namespace: string
  /** Theme override merged over DEFAULT_EDITOR_THEME (e.g. issue_tracker palette). */
  theme?: EditorTheme
  /** App-specific Lexical nodes appended to the defaults. */
  extraNodes?: Array<Klass<LexicalNode>>
  initialState?: SerializedEditorState
  autoFocus?: boolean
  placeholder?: ReactElement
  /** Class for the editor surface container (mention typeahead anchors here). */
  className?: string
  contentEditableClassName?: string
  ariaLabel?: string
  /** Inject a mention search source to enable @-typeahead. Omit → no typeahead. */
  mentionSearch?: (query: MentionQuery) => Promise<MentionTarget[]>
  /** Override the typeahead result-list UI. */
  mentionResultRenderer?: (props: MentionResultListProps) => ReactNode
  emojiMap?: Record<string, string>
  maxChars?: number
  transformers?: Transformer[]
  onChange?: (state: EditorState) => void
  onFilesPasted?: (files: File[]) => void
  onImagePasteBlocked?: () => void
  onCharLimitExceeded?: () => void
  /** Enter-to-submit (Shift+Enter inserts newline; suppressed during IME compose). */
  onSubmit?: (state: SerializedEditorState, plainText: string) => void
}

/**
 * Ready-to-mount, app-agnostic rich-text editor. Wires the full Lexical plugin
 * stack (history, lists, links, markdown shortcuts, emoji, IME guard, paste
 * sanitizer, mention typeahead) so apps don't reassemble Lexical. App chrome
 * (attachments, drag-drop, send button) wraps this and drives it via the ref.
 */
export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(props, ref) {
    const initialConfig = useMemo(
      () =>
        createEditorConfig({
          namespace: props.namespace,
          theme: props.theme,
          extraNodes: props.extraNodes,
        }),
      [props.namespace, props.theme, props.extraNodes],
    )

    return (
      <LexicalComposer key={props.namespace} initialConfig={initialConfig}>
        <EditorInner forwardedRef={ref} {...props} />
      </LexicalComposer>
    )
  },
)

function EditorInner({
  forwardedRef,
  initialState,
  autoFocus = true,
  placeholder,
  className = 'relative flex-1',
  contentEditableClassName = 'max-h-[40vh] min-h-[44px] overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring',
  ariaLabel = 'Rich text editor',
  mentionSearch,
  mentionResultRenderer,
  emojiMap,
  maxChars,
  transformers = RICH_TEXT_TRANSFORMERS,
  onChange,
  onFilesPasted,
  onImagePasteBlocked,
  onCharLimitExceeded,
  onSubmit,
}: RichTextEditorProps & { forwardedRef: React.Ref<RichTextEditorHandle> }) {
  const [editor] = useLexicalComposerContext()
  const composingRef = useRef(false)
  const initialStateRef = useRef(initialState)

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => editor.focus(),
      clear: () => {
        editor.update(() => {
          $getRoot().clear()
        })
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
      },
      getEditor: () => editor,
      getSerializedState: () => editor.getEditorState().toJSON(),
      getPlainText: () => editor.getEditorState().read(() => $getRoot().getTextContent()),
    }),
    [editor],
  )

  // Restore initial state once on mount.
  useMountEffect(() => {
    const state = initialStateRef.current
    if (!state) return
    try {
      editor.setEditorState(editor.parseEditorState(state))
    } catch (err) {
      console.warn('[RichTextEditor] initial state restore failed', err)
    }
  })

  // Enter-to-submit (opt-in).
  useSubmitCommand(editor, composingRef, onSubmit)

  return (
    <div className={className}>
      {mentionSearch ? (
        <MentionTypeaheadPlugin
          mentionSearch={mentionSearch}
          resultRenderer={mentionResultRenderer}
        />
      ) : null}
      <RichTextPlugin
        contentEditable={
          <ContentEditable className={contentEditableClassName} aria-label={ariaLabel} />
        }
        placeholder={placeholder ?? null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      {onChange ? <OnChangePlugin onChange={onChange} ignoreSelectionChange /> : null}
      {autoFocus ? <AutoFocusPlugin /> : null}
      <LinkPlugin />
      <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
      <ListPlugin />
      <MarkdownShortcutPlugin transformers={transformers} />
      <ImeGuardPlugin composingRef={composingRef} />
      <EmojiReplacePlugin emojiMap={emojiMap} />
      <PasteSanitizerPlugin
        maxChars={maxChars}
        onFilesPasted={onFilesPasted}
        onImagePasteBlocked={onImagePasteBlocked}
        onCharLimitExceeded={onCharLimitExceeded}
      />
    </div>
  )
}

function useMountEffect(fn: () => void): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: run-once on mount
  useEffect(fn, [])
}

function useSubmitCommand(
  editor: LexicalEditor,
  composingRef: React.MutableRefObject<boolean>,
  onSubmit?: (state: SerializedEditorState, plainText: string) => void,
): void {
  useEffect(() => {
    if (!onSubmit) return undefined
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!(event instanceof KeyboardEvent)) return false
        if (event.shiftKey) return false
        if (composingRef.current) return true

        let plainText = ''
        let content: SerializedEditorState | null = null
        editor.getEditorState().read(() => {
          plainText = $getRoot().getTextContent()
          content = editor.getEditorState().toJSON()
        })
        event.preventDefault()
        if (content) onSubmit(content, plainText)
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, composingRef, onSubmit])
}
