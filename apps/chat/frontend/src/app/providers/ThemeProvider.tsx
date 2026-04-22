import { useEffect, type ReactNode } from 'react'
import { useUiStore } from '@/shared/store/uiStore'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  return <>{children}</>
}
