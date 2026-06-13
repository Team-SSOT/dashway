import { $generateNodesFromDOM } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

const DEFAULT_MAX_CHARS = 50_000

interface Props {
  maxChars?: number
  onFilesPasted?: (files: File[]) => void
  onImagePasteBlocked?: () => void
  onCharLimitExceeded?: () => void
}

export function PasteSanitizerPlugin({
  maxChars = DEFAULT_MAX_CHARS,
  onFilesPasted,
  onImagePasteBlocked,
  onCharLimitExceeded,
}: Props = {}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false
        const clipboard = event.clipboardData
        if (!clipboard) return false

        const files = Array.from(clipboard.files)
        if (files.length > 0) {
          event.preventDefault()
          if (onFilesPasted) onFilesPasted(files)
          else onImagePasteBlocked?.()
          return true
        }

        const plain = clipboard.getData('text/plain') ?? ''
        if (plain.length > maxChars) {
          event.preventDefault()
          onCharLimitExceeded?.()
          return true
        }

        const html = clipboard.getData('text/html')
        if (html) {
          event.preventDefault()
          try {
            const parser = new DOMParser()
            const dom = parser.parseFromString(html, 'text/html')
            editor.update(() => {
              const nodes = $generateNodesFromDOM(editor, dom)
              $insertNodes(nodes)
            })
          } catch (err) {
            console.warn('[PasteSanitizer] HTML parse failed, falling back to plain', err)
            editor.update(() => {
              $insertNodes([$createTextNode(plain)])
            })
          }
          return true
        }

        if (plain) {
          event.preventDefault()
          editor.update(() => {
            $insertNodes([$createTextNode(plain)])
          })
          return true
        }

        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, maxChars, onFilesPasted, onImagePasteBlocked, onCharLimitExceeded])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if ($getRoot().getTextContent().length > maxChars) {
          onCharLimitExceeded?.()
        }
      })
    })
  }, [editor, maxChars, onCharLimitExceeded])

  return null
}
