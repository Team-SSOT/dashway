import type { ReactNode } from 'react'
import type { Environment } from 'relay-runtime'
import { RelayProvider } from './RelayProvider'
import { ThemeProvider } from './ThemeProvider'

interface Props {
  relayEnvironment: Environment
  initialTheme?: 'system' | 'light' | 'dark'
  children: ReactNode
}

export function AppProviders({ relayEnvironment, initialTheme, children }: Props) {
  return (
    <RelayProvider environment={relayEnvironment}>
      <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
    </RelayProvider>
  )
}
