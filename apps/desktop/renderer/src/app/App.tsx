import type {
  ShellBootstrapReadyResult,
  ShellLoginInput,
  ShellSignupInput,
  ThemeMode,
} from '@dashway/config-schema'
import { useEffect, useMemo, useState } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { BootErrorPage } from '../pages/BootErrorPage'
import { BootingPage } from '../pages/BootingPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServerUrlOnboardingPage } from '../pages/ServerUrlOnboardingPage'
import { SignupPage } from '../pages/SignupPage'
import { createRelayEnvironment } from '../relay'
import { AppShell } from '../shell/layout/AppShell'
import { useShellStore } from '../shell/model/shell-store'
import { RemoteAppRoute } from '../shell/routes/RemoteAppRoute'
import { ShellIndexRoute } from '../shell/routes/ShellIndexRoute'
import { AppProviders } from './providers/AppProviders'

type BootPhase =
  | 'booting'
  | 'needs_server_url'
  | 'unauthenticated'
  | 'loading'
  | 'ready'
  | 'bootstrap_error'
type LoadingContext = 'bootstrap' | 'login' | 'signup' | 'retry' | 'logout'
type AuthView = 'signin' | 'signup'

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function logShellReady(source: 'bootstrap' | 'login', payload: ShellBootstrapReadyResult) {
  console.info('[dashway:shell] shell ready', {
    source,
    member: {
      id: payload.member.id,
      email: payload.member.email,
      authorities: payload.member.authorities,
    },
    workspaceCount: payload.workspaces.length,
    workspaces: payload.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
    })),
    apps: payload.workspaceConfig.apps.map((app) => ({
      id: app.id,
      title: app.title,
      entryUrl: app.entryUrl,
    })),
    activeWorkspaceId: payload.activeWorkspaceId,
    enabledApps: payload.workspaceConfig.enabledApps,
    navOrder: payload.workspaceConfig.navOrder,
    defaultApp: payload.workspaceConfig.defaultApp,
  })
}

export function App() {
  const [phase, setPhase] = useState<BootPhase>('booting')
  const [loadingContext, setLoadingContext] = useState<LoadingContext>('bootstrap')
  const [initialTheme, setInitialTheme] = useState<ThemeMode>('dark')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authView, setAuthView] = useState<AuthView>('signin')
  const [bootError, setBootError] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string>('')

  const relayEnvironment = useMemo(() => createRelayEnvironment(), [])

  const router = useMemo(() => {
    return createHashRouter([
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <ShellIndexRoute />,
          },
          {
            path: 'apps/:appId/*',
            element: <RemoteAppRoute />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ])
  }, [])

  const hydrateShell = (payload: ShellBootstrapReadyResult) => {
    setInitialTheme(payload.initialTheme)
    useShellStore.getState().hydrateBootstrap(payload)
  }

  const transitionToUnauthenticated = (nextTheme?: ThemeMode, nextError?: string | null) => {
    if (nextTheme) {
      setInitialTheme(nextTheme)
    }

    useShellStore.getState().clearSession()
    setAuthError(nextError ?? null)
    setBootError(null)
    setPhase('unauthenticated')
  }

  const loadBootstrap = async (mode: 'booting' | 'retry' = 'booting') => {
    setLoadingContext(mode === 'retry' ? 'retry' : 'bootstrap')
    setAuthError(null)
    setBootError(null)
    setPhase(mode === 'retry' ? 'loading' : 'booting')

    try {
      const storedUrl = await window.desktop.shell.getServerUrl()
      setServerUrl(storedUrl)
      if (!storedUrl) {
        setPhase('needs_server_url')
        return
      }

      const payload = await window.desktop.shell.getBootstrap()
      setInitialTheme(payload.initialTheme)

      if (payload.status === 'unauthenticated') {
        transitionToUnauthenticated(payload.initialTheme)
        return
      }

      logShellReady('bootstrap', payload)
      hydrateShell(payload)
      setPhase('ready')
    } catch (error) {
      console.error('Bootstrap failed:', error)
      setBootError(readErrorMessage(error, 'Could not load your workspace shell.'))
      setPhase('bootstrap_error')
    }
  }

  const handleServerUrlSubmit = async (url: string) => {
    const probe = await window.desktop.shell.probeServer(url)
    if (!probe.ok) {
      throw new Error(probe.error ?? 'Could not reach the server.')
    }

    await window.desktop.shell.setServerUrl(url)
    setServerUrl(url)
    await loadBootstrap('retry')
  }

  const handleLogin = async (input: ShellLoginInput) => {
    setLoadingContext('login')
    setAuthError(null)
    setBootError(null)
    setPhase('loading')

    try {
      const payload = await window.desktop.shell.login(input)
      logShellReady('login', payload)
      hydrateShell(payload)
      setPhase('ready')
    } catch (error) {
      console.error('Login failed:', error)
      setAuthError(readErrorMessage(error, 'Could not complete sign in.'))
      setPhase('unauthenticated')
      throw error
    }
  }

  const handleSignup = async (input: ShellSignupInput) => {
    setLoadingContext('signup')
    setAuthError(null)
    setBootError(null)
    setPhase('loading')

    try {
      await window.desktop.shell.signup(input)
      const payload = await window.desktop.shell.login({
        email: input.email,
        password: input.password,
      })
      logShellReady('login', payload)
      hydrateShell(payload)
      setAuthView('signin')
      setPhase('ready')
    } catch (error) {
      console.error('Sign-up failed:', error)
      setAuthError(readErrorMessage(error, 'Could not complete sign up.'))
      setPhase('unauthenticated')
      throw error
    }
  }

  const handleLogout = async () => {
    setLoadingContext('logout')
    setAuthError(null)
    setBootError(null)
    setPhase('loading')

    try {
      await window.desktop.shell.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      transitionToUnauthenticated(initialTheme)
    }
  }

  useEffect(() => {
    void loadBootstrap()
  }, [])

  useEffect(() => {
    return window.desktop.events.onSessionInvalidated(() => {
      transitionToUnauthenticated(initialTheme, 'Your session expired. Please sign in again.')
    })
  }, [initialTheme])

  if (phase === 'booting') {
    return <BootingPage message="Restoring your session..." />
  }

  if (phase === 'needs_server_url') {
    return <ServerUrlOnboardingPage initialUrl={serverUrl} onSubmit={handleServerUrlSubmit} />
  }

  if (phase === 'loading' && loadingContext !== 'login' && loadingContext !== 'signup') {
    const message =
      loadingContext === 'logout'
        ? 'Signing you out...'
        : loadingContext === 'retry'
          ? 'Retrying shell bootstrap...'
          : 'Loading your workspace...'

    return <BootingPage message={message} />
  }

  if (phase === 'bootstrap_error') {
    return (
      <BootErrorPage
        error={bootError ?? 'Could not load your workspace shell.'}
        onRetry={() => void loadBootstrap('retry')}
        onLogout={() => void handleLogout()}
      />
    )
  }

  if (
    phase === 'unauthenticated' ||
    (phase === 'loading' && (loadingContext === 'login' || loadingContext === 'signup'))
  ) {
    if (authView === 'signup') {
      return (
        <SignupPage
          error={authError}
          submitting={phase === 'loading'}
          onSubmit={handleSignup}
          onSwitchToSignin={() => {
            setAuthError(null)
            setAuthView('signin')
          }}
        />
      )
    }

    return (
      <LoginPage
        error={authError}
        submitting={phase === 'loading'}
        onSubmit={handleLogin}
        onSwitchToSignup={() => {
          setAuthError(null)
          setAuthView('signup')
        }}
      />
    )
  }

  return (
    <AppProviders relayEnvironment={relayEnvironment} initialTheme={initialTheme}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
