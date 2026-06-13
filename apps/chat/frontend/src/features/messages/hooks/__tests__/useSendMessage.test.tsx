import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { SerializedEditorState } from 'lexical'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatMessage, SendMessageInput } from '@/types/chat'
import { useSendMessage } from '../useSendMessage'

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/app/providers/DataSourceProvider', () => ({
  useDataSource: () => ({ repo: { sendMessage: mocks.sendMessage } }),
}))

vi.mock('@/app/providers/AuthProvider', () => ({
  useAuthToken: () => ({ memberId: '1001' }),
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

function serverMessage(input: SendMessageInput): ChatMessage {
  return {
    id: 'server-1',
    roomId: input.roomId,
    authorId: '1001',
    content: input.content,
    plainText: input.plainText,
    clientCreatedAt: input.clientCreatedAt,
    serverCreatedAt: '2026-06-13T10:00:00+09:00',
    editedAt: null,
    deletedAt: null,
    threadParentId: input.threadParentId ?? null,
    replyCount: 0,
    clientMsgId: input.clientMsgId,
    contentVersion: 1,
    version: 1,
    mentions: input.mentions,
  }
}

describe('useSendMessage', () => {
  beforeEach(() => {
    mocks.sendMessage.mockReset()
    mocks.sendMessage.mockImplementation(async (input: SendMessageInput) => serverMessage(input))
  })

  it('passes content mentions through to ChatRepository.sendMessage', async () => {
    const qc = createQueryClient()
    const { result } = renderHook(() => useSendMessage('room-1'), { wrapper: wrapper(qc) })
    const mentions = [{ appId: 'context', memberId: '1002' }]

    await act(async () => {
      await result.current.mutateAsync({
        content,
        plainText: 'Hi @Alice',
        mentions,
      })
    })

    expect(mocks.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 'room-1',
        plainText: 'Hi @Alice',
        mentions,
      }),
    )
  })
})
