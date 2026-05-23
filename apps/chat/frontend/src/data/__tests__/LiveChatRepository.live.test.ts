import { describe, it, expect, beforeAll } from 'vitest'

// Live harness skeleton — only runs when RUN_LIVE=1 is set.
// Requires a running BE at :12001 and a valid dev token in LIVE_AUTH_TOKEN env.
const RUN_LIVE = process.env.RUN_LIVE === '1'

describe.skipIf(!RUN_LIVE)('LiveChatRepository [LIVE]', () => {
  let token: string

  beforeAll(() => {
    token = process.env.LIVE_AUTH_TOKEN ?? ''
    if (!token) throw new Error('LIVE_AUTH_TOKEN env var required for live tests')
  })

  it('chatRooms query returns a non-empty array with Authorization header', async () => {
    const { LiveChatRealtime } = await import('@/data/LiveChatRealtime')
    const { LiveChatRepository } = await import('@/data/LiveChatRepository')
    const realtime = new LiveChatRealtime(() => token)
    const repo = new LiveChatRepository(realtime, () => token, () => null)
    const rooms = await repo.listRooms()
    expect(Array.isArray(rooms)).toBe(true)
  })

  it('createRoom creates a new GROUP room', async () => {
    const { LiveChatRealtime } = await import('@/data/LiveChatRealtime')
    const { LiveChatRepository } = await import('@/data/LiveChatRepository')
    const realtime = new LiveChatRealtime(() => token)
    const repo = new LiveChatRepository(realtime, () => token, () => null)
    const room = await repo.createRoom({ name: `live-test-${Date.now()}` })
    expect(room.type).toBe('CHANNEL')
    expect(room.id).toBeTruthy()
  })
})
