import { useEffect, type MutableRefObject } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

interface Props {
  composingRef: MutableRefObject<boolean>
}

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
