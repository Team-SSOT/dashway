import { type ReactNode, useMemo } from 'react'
import { RelayEnvironmentProvider } from 'react-relay'
import { createRelayEnvironment } from '@/relay/environment'

export const RelayProvider = ({ children }: { children: ReactNode }) => {
  const environment = useMemo(() => createRelayEnvironment(), [])
  return <RelayEnvironmentProvider environment={environment}>{children}</RelayEnvironmentProvider>
}
