import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { type MutableRefObject, useEffect } from 'react'

interface Props {
  composingRef: MutableRefObject<boolean>
}

/** Tracks IME composition state (Korean/CJK) so callers can suppress Enter-to-send
 *  while a character is being composed. */
export function ImeGuardPlugin({ composingRef }: Props) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return undefined

    const onStart = () => {
      composingRef.current = true
    }
    const onEnd = () => {
      composingRef.current = false
    }

    rootElement.addEventListener('compositionstart', onStart)
    rootElement.addEventListener('compositionend', onEnd)
    return () => {
      rootElement.removeEventListener('compositionstart', onStart)
      rootElement.removeEventListener('compositionend', onEnd)
    }
  }, [editor, composingRef])

  return null
}
