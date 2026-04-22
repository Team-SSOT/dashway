import { create } from 'zustand'
import type { SerializedEditorState } from 'lexical'
import type { RoomId } from '@/types/chat'

type Theme = 'dark' | 'light'
type RightPaneMode = 'closed' | 'thread' | 'members'

interface UiState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  rightPaneMode: RightPaneMode
  setRightPaneMode: (mode: RightPaneMode) => void

  drafts: Record<RoomId, SerializedEditorState>
  setDraft: (roomId: RoomId, draft: SerializedEditorState | null) => void
}

const THEME_KEY = 'chat.ui.theme'

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, next)
    set({ theme: next })
  },

  rightPaneMode: 'closed',
  setRightPaneMode: (rightPaneMode) => set({ rightPaneMode }),

  drafts: {},
  setDraft: (roomId, draft) =>
    set((state) => {
      const next = { ...state.drafts }
      if (draft == null) delete next[roomId]
      else next[roomId] = draft
      return { drafts: next }
    }),
}))
