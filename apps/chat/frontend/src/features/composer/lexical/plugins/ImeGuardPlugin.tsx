import { useEffect, type MutableRefObject } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

interface Props {
  composingRef: MutableRefObject<boolean>
}

/**
 * Tracks IME composition state on the Lexical root element so the host can
 * swallow Enter-to-send while Korean/CJK/etc. input is being composed.
 */
export function ImeGuardPlugin({ composingRef }: Props) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

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
