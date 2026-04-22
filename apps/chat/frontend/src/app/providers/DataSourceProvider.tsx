import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChatRepository, ChatRealtime } from '@/types/chat'
import { MockChatRepository } from '@/data/MockChatRepository'
import { MockChatRealtime } from '@/data/MockChatRealtime'
import { eventBus } from '@/data/mockEventBus'

interface DataSourceContext {
  repo: ChatRepository
  realtime: ChatRealtime
}

const Context = createContext<DataSourceContext | null>(null)

interface Props {
  children: ReactNode
  repo?: ChatRepository
  realtime?: ChatRealtime
}

export function DataSourceProvider({ children, repo: repoProp, realtime: realtimeProp }: Props) {
  const [instances] = useState(() => {
    const realtime = new MockChatRealtime(eventBus)
    const repo = new MockChatRepository(eventBus)
    return { repo, realtime }
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
    () => ({ repo: repoProp ?? instances.repo, realtime: realtimeProp ?? instances.realtime }),
    [repoProp, realtimeProp, instances]
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDataSource(): DataSourceContext {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useDataSource must be used within <DataSourceProvider>')
  return ctx
}
