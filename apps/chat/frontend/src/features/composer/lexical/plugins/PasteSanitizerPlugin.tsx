import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'

const MAX_CHARS = 50_000

interface Props {
  onImagePasteBlocked?: () => void
  onCharLimitExceeded?: () => void
}

/**
 * Sanitizes paste:
 *   - strips images (clipboard image items blocked for v1)
 *   - caps inbound paste at MAX_CHARS (checked against text/plain)
 *   - prefers text/html → Lexical nodes, falls back to plain text
 * Also monitors total content length and notifies when it exceeds MAX_CHARS.
 */
export function PasteSanitizerPlugin({
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

        // Block any image payload
        const items = Array.from(clipboard.items)
        const hasImage = items.some((i) => i.type.startsWith('image/'))
        if (hasImage) {
          event.preventDefault()
          onImagePasteBlocked?.()
          return true
        }

        const plain = clipboard.getData('text/plain') ?? ''
        if (plain.length > MAX_CHARS) {
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
  }, [editor, onImagePasteBlocked, onCharLimitExceeded])

  // Continuous total-size guard for typed overflow
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const total = $getRoot().getTextContent().length
        if (total > MAX_CHARS) {
          onCharLimitExceeded?.()
        }
      })
    })
  }, [editor, onCharLimitExceeded])

  return null
}
