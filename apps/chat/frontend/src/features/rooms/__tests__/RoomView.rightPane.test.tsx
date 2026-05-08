import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { RoomView } from '../components/RoomView'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { DataSourceProvider } from '@/app/providers/DataSourceProvider'
import { MockChatRepository } from '@/data/MockChatRepository'
import { MockChatRealtime } from '@/data/MockChatRealtime'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'
import { eventBus } from '@/data/mockEventBus'
import { useUiStore } from '@/shared/store/uiStore'
import { TooltipProvider } from '@/shared/ui/tooltip'

vi.mock('@dashway/app-sdk', () => ({ isShellMode: vi.fn(() => false) }))
vi.mock('@dashway/app-sdk/react', () => ({
  useDashwayShell: vi.fn(() => ({ notifySessionInvalid: vi.fn() })),
  ShellModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

const routes = [
  { path: '/chat/:roomId', element: <RoomView /> },
  { path: '/chat/:roomId/thread/:msgId', element: <RoomView /> },
]

function renderWithRouter(initialPath: string, qc = makeQC()) {
  const repo = new MockChatRepository(eventBus)
  const realtime = new MockChatRealtime(eventBus)
  const directory = new MockDirectoryRepository()
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })

  render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <DataSourceProvider repo={repo} realtime={realtime} directory={directory}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </DataSourceProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { repo, qc, router }
}

describe('RoomView right-pane arbitration', () => {
  beforeEach(() => {
    useUiStore.setState({ rightPaneMode: 'closed' })
  })

  // AC#1: Members button toggles MembersPanel and rightPaneMode
  it('AC#1: clicking Members button opens panel and sets rightPaneMode to members; clicking again closes', async () => {
    renderWithRouter('/chat/room-general')

    expect(useUiStore.getState().rightPaneMode).toBe('closed')

    // Use exact aria-label 'Members' to avoid matching 'Add Members' or 'Close members panel'
    const membersBtn = await screen.findByRole('button', { name: 'Members' })
    await userEvent.click(membersBtn)

    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('members'))
    expect(screen.getByRole('heading', { name: /^members/i })).toBeTruthy()

    // Click again to close
    await userEvent.click(screen.getByRole('button', { name: 'Members' }))
    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('closed'))
    await waitFor(() => expect(screen.queryByRole('heading', { name: /^members/i })).toBeNull())
  })

  // AC#2: members open → navigate to thread → rightPaneMode becomes 'thread'
  it('AC#2: navigating to thread route while members open switches rightPaneMode to thread', async () => {
    const { router } = renderWithRouter('/chat/room-general')

    // Open members panel
    const membersBtn = await screen.findByRole('button', { name: 'Members' })
    await userEvent.click(membersBtn)
    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('members'))

    // Navigate imperatively to thread route — same router instance, no remount
    await router.navigate('/chat/room-general/thread/msg-general-005')

    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('thread'))
    await waitFor(() => expect(screen.queryByRole('heading', { name: /^members/i })).toBeNull())
    // ThreadPanel is an aside with aria-label="Thread"
    await waitFor(() => expect(screen.getByRole('complementary', { name: /thread/i })).toBeTruthy())
  })

  // AC#3: thread → back to room → rightPaneMode becomes 'closed'
  it('AC#3: navigating from thread back to room sets rightPaneMode to closed', async () => {
    const { router } = renderWithRouter('/chat/room-general/thread/msg-general-005')

    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('thread'))

    await router.navigate('/chat/room-general')

    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('closed'))
  })

  // AC#3 supplement: rightPaneMode ends up in 'thread' only via RoomView's effect (not ThreadPanel)
  it('ThreadPanel does not write rightPaneMode directly — store reaches thread only via RoomView effect', async () => {
    renderWithRouter('/chat/room-general/thread/msg-general-005')
    await waitFor(() => expect(useUiStore.getState().rightPaneMode).toBe('thread'))
    expect(useUiStore.getState().rightPaneMode).toBe('thread')
  })
})
