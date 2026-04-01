import type { ReactNode } from 'react'
import { RelayEnvironmentProvider } from 'react-relay'
import type { Environment } from 'relay-runtime'

interface Props {
  environment: Environment
  children: ReactNode
}

export function RelayProvider({ environment, children }: Props) {
  return <RelayEnvironmentProvider environment={environment}>{children}</RelayEnvironmentProvider>
}
