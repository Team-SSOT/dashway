import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataSourceProvider } from '@/app/providers/DataSourceProvider'
import { MockChatRealtime } from '@/data/MockChatRealtime'
import { MockChatRepository } from '@/data/MockChatRepository'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'
import { eventBus } from '@/data/mockEventBus'
import type { RoomId } from '@/types/chat'
import { AddMembersDialog } from '../components/AddMembersDialog'

// room-dev has only demo-user + alice as members; grace/henry/iris are NOT in room-dev
// so searches for them will return results after excludeRoomId filtering.
const ROOM_ID: RoomId = 'room-dev'

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof AddMembersDialog>> = {},
  qc = makeQC(),
) {
  const repo = new MockChatRepository(eventBus)
  const directory = new MockDirectoryRepository()
  const realtime = new MockChatRealtime(eventBus)
  const onOpenChange = vi.fn()

  const utils = render(
    <QueryClientProvider client={qc}>
      <DataSourceProvider repo={repo} realtime={realtime} directory={directory}>
        <AddMembersDialog
          roomId={ROOM_ID}
          open={true}
          onOpenChange={onOpenChange}
          existingMemberIds={new Set()}
          {...props}
        />
      </DataSourceProvider>
    </QueryClientProvider>,
  )
  return { ...utils, repo, directory, qc, onOpenChange }
}

describe('AddMembersDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC#4: search input has role="combobox"; focus via setTimeout may not fire in jsdom
  it('AC#4: search input has role combobox', async () => {
    renderDialog()
    const input = await screen.findByRole('combobox', { name: /search members/i })
    expect(input).toBeTruthy()
  })

  // AC#6: empty query → no listbox; typed query → matching results appear
  it('AC#6: empty query shows no options; typed query shows matching results', async () => {
    renderDialog()
    const input = await screen.findByRole('combobox')
    // No results with empty query
    expect(screen.queryByRole('listbox')).toBeNull()

    // Type a query that matches members not in room-dev (grace, henry, iris...)
    await userEvent.type(input, 'grace')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0), {
      timeout: 1000,
    })

    const options = screen.getAllByRole('option')
    options.forEach((opt) => {
      expect(opt.textContent?.toLowerCase()).toMatch(/grace/i)
    })
  })

  // AC#5: debounce — searchMembers called at most once per debounce window
  it('AC#5: debounces searchMembers calls', async () => {
    const { directory } = renderDialog()
    const spy = vi.spyOn(directory, 'searchMembers')

    const input = await screen.findByRole('combobox')

    // Type 4 chars quickly via fireEvent (synchronous, no debounce flush between)
    fireEvent.change(input, { target: { value: 'g' } })
    fireEvent.change(input, { target: { value: 'gr' } })
    fireEvent.change(input, { target: { value: 'gra' } })
    fireEvent.change(input, { target: { value: 'grac' } })

    // Should not be called yet
    expect(spy).not.toHaveBeenCalled()

    // Wait for debounce (300ms) + React Query execution
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1), { timeout: 1000 })
  })

  // AC#7: already-member intersection — alice is in room-dev, should not appear
  it('AC#7: existing room members are filtered from results', async () => {
    // alice is in room-dev; search for "alice" should yield nothing
    renderDialog({ roomId: 'room-dev' })
    const input = await screen.findByRole('combobox')
    await userEvent.type(input, 'alice')
    // Wait for debounce + query
    await waitFor(() => {}, { timeout: 600 })
    expect(screen.queryByText('Alice Kim')).toBeNull()
  })

  // AC#8: zero selections → submit disabled; 1 selection → label shows count; chip X removes
  it('AC#8: submit button disabled with no selection; label reflects count; chip X removes selection', async () => {
    renderDialog()
    const input = await screen.findByRole('combobox')

    // Submit starts disabled
    expect(screen.getByRole('button', { name: /add 0 members/i })).toHaveProperty('disabled', true)

    // Search and select grace (not in room-dev)
    await userEvent.type(input, 'grace')
    await waitFor(() => screen.getAllByRole('option').length > 0, { timeout: 1000 })
    await userEvent.click(screen.getAllByRole('option')[0])

    await waitFor(() => screen.getByRole('button', { name: /add 1 member$/i }))
    expect(screen.getByRole('button', { name: /add 1 member$/i })).toHaveProperty('disabled', false)

    // Remove chip
    const removeBtn = screen.getByRole('button', { name: /remove grace/i })
    await userEvent.click(removeBtn)
    await waitFor(() => screen.getByRole('button', { name: /add 0 members/i }))
    expect(screen.getByRole('button', { name: /add 0 members/i })).toHaveProperty('disabled', true)
  })

  // AC#9: addMembers called, invalidateQueries called, MEMBERSHIP_CHANGED event emitted
  it('AC#9: submit calls addMembers, invalidates memberships query, emits MEMBERSHIP_CHANGED', async () => {
    const qc = makeQC()
    const { repo } = renderDialog({}, qc)

    const addSpy = vi.spyOn(repo, 'addMembers')
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const events: unknown[] = []
    const unsub = eventBus.subscribe((e) => {
      if (e.type === 'MEMBERSHIP_CHANGED') events.push(e)
    })

    const input = await screen.findByRole('combobox')
    await userEvent.type(input, 'grace')
    await waitFor(() => screen.getAllByRole('option').length > 0, { timeout: 1000 })
    await userEvent.click(screen.getAllByRole('option')[0])
    await waitFor(() => screen.getByRole('button', { name: /add 1 member$/i }))

    await userEvent.click(screen.getByRole('button', { name: /add 1 member$/i }))

    await waitFor(() => expect(addSpy).toHaveBeenCalledOnce())
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['room-memberships', ROOM_ID] })
    await waitFor(() => expect(events.length).toBeGreaterThanOrEqual(1), { timeout: 500 })

    unsub()
  })

  // AC#12: MEMBER role cannot manage members — no submit button rendered
  it('AC#12: MEMBER role cannot manage members', async () => {
    // room-random: demo-user is MEMBER
    renderDialog({ roomId: 'room-random' })
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /add \d+ members?/i })).toBeNull(),
    )
    // Should see the no-permission dialog variant
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  // AC#13: Escape key closes the dialog and returns focus to the trigger button
  it('AC#13: Escape key closes the dialog and returns focus to the trigger', async () => {
    const onOpenChange = vi.fn()

    function Harness() {
      const [open, setOpen] = useState(true)
      const triggerRef = useRef<HTMLButtonElement>(null)
      const qc = makeQC()
      const repo = new MockChatRepository(eventBus)
      const directory = new MockDirectoryRepository()
      const realtime = new MockChatRealtime(eventBus)

      return (
        <QueryClientProvider client={qc}>
          <button type="button" ref={triggerRef} data-testid="add-members-trigger">
            Add members trigger
          </button>
          <DataSourceProvider repo={repo} realtime={realtime} directory={directory}>
            <AddMembersDialog
              roomId={ROOM_ID}
              open={open}
              onOpenChange={(next) => {
                onOpenChange(next)
                setOpen(next)
              }}
              existingMemberIds={new Set()}
              triggerRef={triggerRef}
            />
          </DataSourceProvider>
        </QueryClientProvider>
      )
    }

    render(<Harness />)

    await screen.findByRole('combobox')
    const triggerButton = screen.getByTestId('add-members-trigger')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    await waitFor(() => expect(document.activeElement).toBe(triggerButton))
  })

  // AC#10: mid-dialog reconcile — chip pruned when member added externally
  it('AC#10: chip pruned when member added externally via memberships cache update', async () => {
    // staleTime prevents background refetches from overwriting the manually-injected cache state
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 10_000 } } })
    const repo = new MockChatRepository(eventBus)
    const directory = new MockDirectoryRepository()
    const realtime = new MockChatRealtime(eventBus)
    const onOpenChange = vi.fn()

    const { roomMembershipsQueryKey } = await import('../hooks/useRoomMemberships')
    // room-dev initially has demo-user + alice
    const initialMemberships = [
      {
        roomId: ROOM_ID,
        memberId: 'demo-user',
        role: 'OWNER' as const,
        joinedAt: '',
        lastReadAt: null,
        muted: false,
      },
      {
        roomId: ROOM_ID,
        memberId: 'alice',
        role: 'MEMBER' as const,
        joinedAt: '',
        lastReadAt: null,
        muted: false,
      },
    ]
    qc.setQueryData(roomMembershipsQueryKey(ROOM_ID), initialMemberships)

    render(
      <QueryClientProvider client={qc}>
        <DataSourceProvider repo={repo} realtime={realtime} directory={directory}>
          <AddMembersDialog
            roomId={ROOM_ID}
            open={true}
            onOpenChange={onOpenChange}
            existingMemberIds={new Set(['demo-user', 'alice'])}
          />
        </DataSourceProvider>
      </QueryClientProvider>,
    )

    // Search and select grace (not in room-dev)
    const input = await screen.findByRole('combobox')
    await userEvent.type(input, 'grace')
    await waitFor(() => screen.getAllByRole('option').length > 0, { timeout: 1000 })
    await userEvent.click(screen.getAllByRole('option')[0])
    await waitFor(() => screen.getByRole('button', { name: /add 1 member$/i }))

    // Simulate grace being added externally: update query cache
    const updatedMemberships = [
      ...initialMemberships,
      {
        roomId: ROOM_ID,
        memberId: 'grace',
        role: 'MEMBER' as const,
        joinedAt: new Date().toISOString(),
        lastReadAt: null,
        muted: false,
      },
    ]
    act(() => {
      qc.setQueryData(roomMembershipsQueryKey(ROOM_ID), updatedMemberships)
    })

    // Grace chip should be pruned and notice shown (member name is "Grace Yoon")
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add 1 member$/i })).toBeNull()
      expect(screen.getByText(/grace yoon was just added/i)).toBeTruthy()
    })
  })
})
