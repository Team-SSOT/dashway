import { describe, it, expect, beforeAll } from 'vitest'

// Live harness skeleton — only runs when RUN_LIVE=1 is set.
// Requires a running BE at :12001 with STOMP WS endpoint at /ws/chat.
const RUN_LIVE = process.env.RUN_LIVE === '1'

describe.skipIf(!RUN_LIVE)('LiveChatRealtime [LIVE]', () => {
  let token: string

  beforeAll(() => {
    token = process.env.LIVE_AUTH_TOKEN ?? ''
    if (!token) throw new Error('LIVE_AUTH_TOKEN env var required for live tests')
  })

  it('STOMP CONNECT succeeds with valid token', async () => {
    const { LiveChatRealtime } = await import('@/data/LiveChatRealtime')
    const realtime = new LiveChatRealtime(() => token)

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('CONNECT timeout')), 10_000)
      const dispose = realtime.watchConnection((state) => {
        if (state === 'connected') {
          clearTimeout(timeout)
          dispose()
          resolve()
        } else if (state === 'disconnected') {
          clearTimeout(timeout)
          dispose()
          reject(new Error('Unexpected disconnect during CONNECT'))
        }
      })
    })
  }, 15_000)

  it('SUBSCRIBE + SEND roundtrip delivers echo to watchRoom handler', async () => {
    const { LiveChatRealtime } = await import('@/data/LiveChatRealtime')
    const { LiveChatRepository } = await import('@/data/LiveChatRepository')
    const realtime = new LiveChatRealtime(() => token)
    const repo = new LiveChatRepository(realtime, () => token)
    const rooms = await repo.listRooms()
    expect(rooms.length).toBeGreaterThan(0)
    const roomId = rooms[0].id

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Echo timeout')), 10_000)
      const dispose = realtime.watchRoom(roomId, (event) => {
        if (event.type === 'MESSAGE_CREATED') {
          clearTimeout(timeout)
          dispose()
          resolve()
        }
      })
      realtime.sendMessageOverSocket(roomId, `live-test-${Date.now()}`)
    })
  }, 15_000)
})
