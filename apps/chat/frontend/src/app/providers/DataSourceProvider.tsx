import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChatRepository, ChatRealtime } from '@/types/chat'
import type { DirectoryRepository } from '@/data/DirectoryRepository'
import { MockChatRepository } from '@/data/MockChatRepository'
import { MockChatRealtime } from '@/data/MockChatRealtime'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'
import { eventBus } from '@/data/mockEventBus'
import { LiveChatRealtime } from '@/data/LiveChatRealtime'
import { LiveChatRepository } from '@/data/LiveChatRepository'
import { useAuthToken } from '@/app/providers/AuthProvider'
import { useDashwayShell } from '@dashway/app-sdk/react'

interface DataSourceContext {
  repo: ChatRepository
  realtime: ChatRealtime
  directory: DirectoryRepository
}

const Context = createContext<DataSourceContext | null>(null)

interface Props {
  children: ReactNode
  repo?: ChatRepository
  realtime?: ChatRealtime
  directory?: DirectoryRepository
}

function LiveSources({ children, repoProp, realtimeProp, directoryProp }: {
  children: ReactNode
  repoProp?: ChatRepository
  realtimeProp?: ChatRealtime
  directoryProp?: DirectoryRepository
}) {
  const { token, memberId, version } = useAuthToken()
  const shellClient = useDashwayShell()
  const tokenRef = useRef(token)
  tokenRef.current = token
  const memberIdRef = useRef(memberId)
  memberIdRef.current = memberId

  const [instances] = useState(() => {
    const realtime = new LiveChatRealtime(() => tokenRef.current)
    // 401 응답 시 shell에 session invalid 통보 (app-sdk notifySessionInvalid)
    const repo = new LiveChatRepository(
      realtime,
      () => tokenRef.current,
      () => memberIdRef.current,
      () => shellClient.notifySessionInvalid(),
    )
    const directory = new MockDirectoryRepository() // V1: directory not live yet
    return { repo, realtime, directory }
  })

  // Token rotation: when useAuthToken().version changes, deactivate → re-read token → activate.
  // This is the interlock path from team-exec.md §interlock notes.
  useEffect(() => {
    instances.realtime.reactivateWithFreshToken()
  }, [version, instances.realtime])

  const value = useMemo(
    () => ({
      repo: repoProp ?? instances.repo,
      realtime: realtimeProp ?? instances.realtime,
      directory: directoryProp ?? instances.directory,
    }),
    [repoProp, realtimeProp, directoryProp, instances]
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

function MockSources({ children, repoProp, realtimeProp, directoryProp }: {
  children: ReactNode
  repoProp?: ChatRepository
  realtimeProp?: ChatRealtime
  directoryProp?: DirectoryRepository
}) {
  const [instances] = useState(() => {
    const realtime = new MockChatRealtime(eventBus)
    const repo = new MockChatRepository(eventBus)
    const directory = new MockDirectoryRepository()
    return { repo, realtime, directory }
  })

  // Debug: expose runtime hooks on `window.__chatMocks` for devtools perf
  // testing. Trigger with `__chatMocks.loadHeavyDataset()` or URL flag
  // `?heavy=1` (auto-triggered below).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const repoAny = instances.repo as ChatRepository & {
      __loadHeavyDataset?: () => void
      __mockError?: (method: string) => void
    }
    const realtimeAny = instances.realtime as ChatRealtime & {
      __mockDisconnect?: () => void
    }
    const api = {
      loadHeavyDataset: () => repoAny.__loadHeavyDataset?.(),
      disconnect: () => realtimeAny.__mockDisconnect?.(),
      triggerError: (method: string) => repoAny.__mockError?.(method as never),
    }
    ;(window as unknown as { __chatMocks: typeof api }).__chatMocks = api

    // Auto-trigger heavy dataset on `?heavy=1` so perf recording is one-step
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('heavy') === '1') {
        repoAny.__loadHeavyDataset?.()
      }
    } catch {
      /* ignore */
    }
  }, [instances])

  const value = useMemo(
    () => ({
      repo: repoProp ?? instances.repo,
      realtime: realtimeProp ?? instances.realtime,
      directory: directoryProp ?? instances.directory,
    }),
    [repoProp, realtimeProp, directoryProp, instances]
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function DataSourceProvider({ children, repo: repoProp, realtime: realtimeProp, directory: directoryProp }: Props) {
  if (import.meta.env.VITE_CHAT_DATA_SOURCE === 'live') {
    return (
      <LiveSources repoProp={repoProp} realtimeProp={realtimeProp} directoryProp={directoryProp}>
        {children}
      </LiveSources>
    )
  }
  return (
    <MockSources repoProp={repoProp} realtimeProp={realtimeProp} directoryProp={directoryProp}>
      {children}
    </MockSources>
  )
}

export function useDataSource(): DataSourceContext {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useDataSource must be used within <DataSourceProvider>')
  return ctx
}

export function useDirectory(): DirectoryRepository {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useDirectory must be used within <DataSourceProvider>')
  return ctx.directory
}
