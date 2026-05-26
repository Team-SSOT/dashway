import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataSourceProvider } from '@/app/providers/DataSourceProvider'
import { MockChatRealtime } from '@/data/MockChatRealtime'
import { MockChatRepository } from '@/data/MockChatRepository'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'
import { eventBus } from '@/data/mockEventBus'
import { buildMentionTargets } from '@/features/composer/mock/mockMentionTargets'
import type { RoomId } from '@/types/chat'
import { MembersPanel } from '../components/MembersPanel'

// room-dev: demo-user (ADMIN) + alice (MEMBER) — demo-user can manage members
// grace, henry, iris etc. are NOT in room-dev so searches return results
const ROOM_ID: RoomId = 'room-dev'

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderMembersPanel(
  roomId: RoomId = ROOM_ID,
  qc = makeQC(),
  repo?: MockChatRepository,
  directory?: MockDirectoryRepository,
) {
  const r = repo ?? new MockChatRepository(eventBus)
  const d = directory ?? new MockDirectoryRepository()
  const realtime = new MockChatRealtime(eventBus)
  const onClose = vi.fn()

  const utils = render(
    <QueryClientProvider client={qc}>
      <DataSourceProvider repo={r} realtime={realtime} directory={d}>
        <MembersPanel roomId={roomId} onClose={onClose} />
      </DataSourceProvider>
    </QueryClientProvider>,
  )
  return { ...utils, repo: r, directory: d, qc, onClose }
}

describe('membership-flow integration', () => {
  // Full add-member flow: open panel → Add Members → search → select → submit
  it('full add-member flow: invalidation and MEMBERSHIP_CHANGED on add', async () => {
    const qc = makeQC()
    const { qc: usedQc } = renderMembersPanel(ROOM_ID, qc)
    const invalidateSpy = vi.spyOn(usedQc, 'invalidateQueries')

    const events: unknown[] = []
    const unsub = eventBus.subscribe((e) => {
      if (e.type === 'MEMBERSHIP_CHANGED') events.push(e)
    })

    // Wait for Add Members button (demo-user is ADMIN in room-dev)
    const addBtn = await screen.findByRole('button', { name: /add members/i })
    await userEvent.click(addBtn)

    // Dialog opens — search for "grace" (not in room-dev)
    const input = await screen.findByRole('combobox', { name: /search members/i })
    await userEvent.type(input, 'grace')
    await waitFor(() => screen.getAllByRole('option').length > 0, { timeout: 1000 })
    await userEvent.click(screen.getAllByRole('option')[0])
    await waitFor(() => screen.getByRole('button', { name: /add 1 member$/i }))

    await userEvent.click(screen.getByRole('button', { name: /add 1 member$/i }))

    // invalidateQueries called with the room-memberships key
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(1))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['room-memberships', ROOM_ID] })
    // MEMBERSHIP_CHANGED event emitted
    await waitFor(() => expect(events.length).toBeGreaterThanOrEqual(1), { timeout: 500 })
    expect(events.length).toBe(1)

    unsub()
  })

  // AC#15: mention parity — member mention targets match directory.searchMembers
  it('AC#15: buildMentionTargets person results match directory.searchMembers for same query', async () => {
    const directory = new MockDirectoryRepository()
    const q = 'al'
    const limit = 10

    const [mentionResult, directoryResult] = await Promise.all([
      buildMentionTargets(directory, { query: q, limit }),
      directory.searchMembers({ q, limit }),
    ])

    const personIds = mentionResult
      .filter((t) => t.appId === 'context-api' && t.resourceType === 'member')
      .map((t) => t.resourceId)
    const directoryIds = directoryResult.items.map((m) => m.id)

    expect(personIds).toEqual(directoryIds)
  })

  // AC#11: optimistic remove rollback — setQueryData called without alice, then snapshot restored, no MEMBERSHIP_CHANGED
  it('AC#11: remove rollback on error — optimistic update applied then rolled back, no MEMBERSHIP_CHANGED emitted', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 10_000 } },
    })
    const repo = new MockChatRepository(eventBus)
    renderMembersPanel(ROOM_ID, qc, repo)

    // Wait for the member list to load (alice is in room-dev, not self, not owner)
    await screen.findByText('Alice Kim')

    // Spy on setQueryData BEFORE injecting error so we can observe the optimistic update
    const setQueryDataSpy = vi.spyOn(qc, 'setQueryData')

    // Inject error so removeMember rejects
    repo.__mockError('removeMember')

    const events: unknown[] = []
    const unsub = eventBus.subscribe((e) => {
      if (e.type === 'MEMBERSHIP_CHANGED') events.push(e)
    })

    // Click remove for Alice Kim
    const removeBtn = await screen.findByRole('button', { name: /remove alice kim/i })
    await userEvent.click(removeBtn)

    // Optimistic update: setQueryData called with alice filtered out
    await waitFor(() =>
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        expect.arrayContaining(['room-memberships', ROOM_ID]),
        expect.any(Function),
      ),
    )

    // Rollback: after rejection, alice is restored in the DOM
    await waitFor(() => screen.getByText('Alice Kim'), { timeout: 2000 })

    // No MEMBERSHIP_CHANGED event should have been emitted
    expect(events).toHaveLength(0)

    unsub()
  })

  // AC#14: empty state — MembersPanel with no memberships shows "No members yet"
  it('AC#14: empty state shows "No members yet" without calling searchMembers', async () => {
    const directory = new MockDirectoryRepository()
    const searchSpy = vi.spyOn(directory, 'searchMembers')

    const EMPTY_ROOM: RoomId = 'room-empty-test'
    const repo = new MockChatRepository(eventBus)
    const qc = makeQC()

    // Pre-seed empty memberships for this room
    const { roomMembershipsQueryKey } = await import('../hooks/useRoomMemberships')
    qc.setQueryData(roomMembershipsQueryKey(EMPTY_ROOM), [])

    const realtime = new MockChatRealtime(eventBus)
    render(
      <QueryClientProvider client={qc}>
        <DataSourceProvider repo={repo} realtime={realtime} directory={directory}>
          <MembersPanel roomId={EMPTY_ROOM} onClose={vi.fn()} />
        </DataSourceProvider>
      </QueryClientProvider>,
    )

    await screen.findByText(/no members yet/i)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  // AC#16: defense-in-depth repository guard rejects member management for MEMBER role
  it('AC#16: repository rejects add/remove when current user is only a room MEMBER', async () => {
    const repo = new MockChatRepository(eventBus)

    await expect(repo.addMembers('room-random', ['grace'])).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(repo.removeMember('room-random', 'bob')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
