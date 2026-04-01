import { useEffect, useMemo, useState } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { BootingPage } from '../pages/BootingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { createRelayEnvironment } from '../relay'
import { AppShell } from '../shell/layout/AppShell'
import { useShellStore } from '../shell/model/shell-store'
import { appRegistry } from '../shell/registry/app-registry'
import { AppProviders } from './providers/AppProviders'

// Static imports for initial apps
import '../apps/home'
import '../apps/chat'
import '../apps/tasks'

type BootPhase = 'booting' | 'ready'

export function App() {
  const [phase, setPhase] = useState<BootPhase>('booting')
  const [initialTheme, setInitialTheme] = useState<'system' | 'light' | 'dark'>('dark')

  const relayEnvironment = useMemo(() => createRelayEnvironment(), [])

  const router = useMemo(() => {
    const routes = appRegistry.buildRoutes()
    return createHashRouter([
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/home" replace />,
          },
          ...routes,
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ])
  }, [])

  useEffect(() => {
    async function bootstrap() {
      try {
        const payload = await window.desktop.shell.getBootstrap()
        setInitialTheme(payload.initialTheme)

        const store = useShellStore.getState()
        store.setWorkspaces(payload.workspaces)
        store.setActiveWorkspace(payload.workspaceId)

        const config = await window.desktop.workspace.getConfig()
        store.setWorkspaceConfig(config)
        store.setActiveApp(config.defaultApp)

        setPhase('ready')
      } catch (err) {
        console.error('Bootstrap failed:', err)
      }
    }

    bootstrap()
  }, [])

  if (phase === 'booting') {
    return <BootingPage />
  }

  return (
    <AppProviders relayEnvironment={relayEnvironment} initialTheme={initialTheme}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
