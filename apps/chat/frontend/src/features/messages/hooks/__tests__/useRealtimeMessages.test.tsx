import { type InfiniteData, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { SerializedEditorState } from 'lexical'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatMessage, ChatRealtimeEvent, Page } from '@/types/chat'
import { useRealtimeMessages } from '../useRealtimeMessages'
import { roomMessagesQueryKey } from '../useRoomMessages'

const mocks = vi.hoisted(() => ({
  watchRoom: vi.fn(),
  roomHandler: undefined as ((event: ChatRealtimeEvent) => void) | undefined,
}))

vi.mock('@/app/providers/DataSourceProvider', () => ({
  useDataSource: () => ({ realtime: { watchRoom: mocks.watchRoom } }),
}))

vi.mock('@/app/featureFlags', () => ({
  useIsLive: () => true,
}))

const content = {
  root: {
    children: [],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrapper(client: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    roomId: 'room-1',
    authorId: '1001',
    content,
    plainText: 'Original',
    clientCreatedAt: '2026-06-13T10:00:00+09:00',
    serverCreatedAt: '2026-06-13T10:00:00+09:00',
    editedAt: null,
    deletedAt: null,
    threadParentId: null,
    replyCount: 0,
    clientMsgId: 'client-1',
    contentVersion: 1,
    version: 1,
    ...overrides,
  }
}

function seedMessages(client: QueryClient, item: ChatMessage) {
  client.setQueryData<InfiniteData<Page<ChatMessage>>>(roomMessagesQueryKey('room-1'), {
    pageParams: [undefined],
    pages: [{ items: [item], nextCursor: null, prevCursor: null }],
  })
}

function cachedMessage(client: QueryClient): ChatMessage {
  const data = client.getQueryData<InfiniteData<Page<ChatMessage>>>(roomMessagesQueryKey('room-1'))
  const item = data?.pages[0]?.items[0]
  if (!item) throw new Error('missing cached message')
  return item
}

describe('useRealtimeMessages', () => {
  beforeEach(() => {
    mocks.roomHandler = undefined
    mocks.watchRoom.mockReset()
    mocks.watchRoom.mockImplementation(
      (_roomId: string, handler: (event: ChatRealtimeEvent) => void) => {
        mocks.roomHandler = handler
        return vi.fn()
      },
    )
  })

  it('applies live MESSAGE_UPDATED events to the room cache', () => {
    const qc = createQueryClient()
    seedMessages(qc, message())
    renderHook(() => useRealtimeMessages('room-1'), { wrapper: wrapper(qc) })

    act(() => {
      mocks.roomHandler?.({
        type: 'MESSAGE_UPDATED',
        message: message({ plainText: 'Edited', editedAt: '2026-06-13T10:01:00+09:00' }),
      })
    })

    expect(cachedMessage(qc).plainText).toBe('Edited')
    expect(cachedMessage(qc).editedAt).toBe('2026-06-13T10:01:00+09:00')
  })

  it('applies live MESSAGE_DELETED events to the room cache', () => {
    const qc = createQueryClient()
    seedMessages(qc, message())
    renderHook(() => useRealtimeMessages('room-1'), { wrapper: wrapper(qc) })

    act(() => {
      mocks.roomHandler?.({
        type: 'MESSAGE_DELETED',
        messageId: 'msg-1',
        roomId: 'room-1',
        deletedAt: '2026-06-13T10:02:00+09:00',
      })
    })

    expect(cachedMessage(qc).deletedAt).toBe('2026-06-13T10:02:00+09:00')
  })
})
