import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface Props {
  initialTheme?: Theme
  children: ReactNode
}

export function ThemeProvider({ initialTheme = 'dark', children }: Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    document.documentElement.setAttribute('data-theme', resolved)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
