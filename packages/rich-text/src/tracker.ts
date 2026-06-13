import type { LexicalEditor, NodeKey } from 'lexical'
import { $getNodeByKey } from 'lexical'
import { $isMentionNode, MentionNode } from './nodes/MentionNode'
import type { MentionRef, MentionTarget } from './types'

export interface MentionTracker {
  values(): MentionRef[]
  get(key: NodeKey): MentionRef | undefined
  subscribe(listener: (refs: MentionRef[]) => void): () => void
  dispose(): void
}

function toMentionRef(target: MentionTarget): MentionRef {
  return { id: target.id, type: target.type, label: target.label }
}

export function createMentionTracker(editor: LexicalEditor): MentionTracker {
  const map = new Map<NodeKey, MentionRef>()
  const subscribers = new Set<(refs: MentionRef[]) => void>()

  const values = (): MentionRef[] => Array.from(map.values())

  const notify = (): void => {
    const refs = values()
    for (const listener of subscribers) {
      listener(refs)
    }
  }

  const unregister = editor.registerMutationListener(MentionNode, (nodes) => {
    let changed = false
    const toRead: NodeKey[] = []

    for (const [key, mutation] of nodes) {
      if (mutation === 'destroyed') {
        if (map.delete(key)) {
          changed = true
        }
      } else {
        // 'created' | 'updated' — node still exists, read it inside editor state
        toRead.push(key)
      }
    }

    if (toRead.length > 0) {
      editor.getEditorState().read(() => {
        for (const key of toRead) {
          const node = $getNodeByKey(key)
          if ($isMentionNode(node)) {
            map.set(key, toMentionRef(node.__target))
            changed = true
          }
        }
      })
    }

    if (changed) {
      notify()
    }
  })

  return {
    values,
    get: (key: NodeKey) => map.get(key),
    subscribe: (listener: (refs: MentionRef[]) => void) => {
      subscribers.add(listener)
      return () => {
        subscribers.delete(listener)
      }
    },
    dispose: () => {
      unregister()
      subscribers.clear()
      map.clear()
    },
  }
}
