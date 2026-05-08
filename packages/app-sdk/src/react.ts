import type { SidebarSpec, ThemeMode } from '@dashway/app-protocol'
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createDashwayAppClient, type DashwayAppClient, isShellMode } from './client'

const ShellContext = createContext<DashwayAppClient | null>(null)

interface ShellModeProviderProps {
  appId: string
  manifest?: { sidebar: SidebarSpec }
  children: ReactNode
}

export function ShellModeProvider({ appId, manifest, children }: ShellModeProviderProps) {
  // 클라이언트는 render 시점에 생성 (자식이 useContext로 즉시 접근 가능해야 함).
  // 단, listener attach + hello 송신은 effect로 미룬다 — 자식들의 effect(handler 등록)가 먼저 실행되도록.
  const [client] = useState<DashwayAppClient>(() => createDashwayAppClient({ appId }))

  useEffect(() => {
    // 자식 컴포넌트들의 useEffect가 모두 실행된 *후* (bottom-up) parent의 effect가 실행됨.
    // 따라서 useShellNavigation 등이 onNavigate handler 등록을 마친 다음 hello가 나간다.
    client.start()
    return () => {
      client.destroy()
    }
  }, [client])

  useEffect(() => {
    if (manifest && client.isShellMode()) {
      client.publishSidebar(manifest.sidebar)
    }
  }, [client, manifest])

  return createElement(ShellContext.Provider, { value: client }, children)
}

export function useDashwayShell(): DashwayAppClient {
  const client = useContext(ShellContext)
  if (!client) {
    throw new Error('useDashwayShell must be used within a ShellModeProvider')
  }
  return client
}

export function useIsShellMode(): boolean {
  return useMemo(() => isShellMode(), [])
}

export function useShellNavigation(onNavigate: (appRoute: string) => void): void {
  const client = useContext(ShellContext)
  const handlerRef = useRef(onNavigate)
  handlerRef.current = onNavigate

  useEffect(() => {
    if (!client) return
    return client.onNavigate((route) => handlerRef.current(route))
  }, [client])
}

export function useShellTheme(onThemeChange: (mode: ThemeMode) => void): void {
  const client = useContext(ShellContext)
  const handlerRef = useRef(onThemeChange)
  handlerRef.current = onThemeChange

  useEffect(() => {
    if (!client) return
    return client.onThemeChange((mode) => handlerRef.current(mode))
  }, [client])
}

export function useShellAuthToken(onAuthToken: (token: string | null) => void): void {
  const client = useContext(ShellContext)
  const handlerRef = useRef(onAuthToken)
  handlerRef.current = onAuthToken

  useEffect(() => {
    if (!client) return
    return client.onAuthToken((token) => handlerRef.current(token))
  }, [client])
}
