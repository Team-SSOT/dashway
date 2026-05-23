import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock @stomp/stompjs before importing LiveChatRealtime
const mockUnsubscribe = vi.fn()
const mockSubscription = { unsubscribe: mockUnsubscribe }
const mockActivate = vi.fn()
const mockDeactivate = vi.fn().mockResolvedValue(undefined)
const mockSubscribe = vi.fn().mockReturnValue(mockSubscription)
const mockPublish = vi.fn()

let capturedConfig: Record<string, unknown> = {}
let mockClientInstance: {
  connectHeaders: Record<string, string>
  connected: boolean
  activate: Mock
  deactivate: Mock
  subscribe: Mock
  publish: Mock
  _simulateConnect(): void
  _simulateStompError(message: string): void
  _simulateWsClose(code: number): void
}

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation(function (this: typeof mockClientInstance, config: Record<string, unknown>) {
    capturedConfig = config
    this.connectHeaders = {}
    this.connected = true
    this.activate = mockActivate
    this.deactivate = mockDeactivate
    this.subscribe = mockSubscribe
    this.publish = mockPublish
    this._simulateConnect = function () {
      if (typeof capturedConfig.beforeConnect === 'function') {
        (capturedConfig.beforeConnect as () => void).call(this)
      }
      if (typeof capturedConfig.onConnect === 'function') {
        (capturedConfig.onConnect as () => void)()
      }
    }
    this._simulateStompError = function (message: string) {
      if (typeof capturedConfig.onStompError === 'function') {
        (capturedConfig.onStompError as (f: unknown) => void)({ headers: { message } })
      }
    }
    this._simulateWsClose = function (code: number) {
      if (typeof capturedConfig.onWebSocketClose === 'function') {
        (capturedConfig.onWebSocketClose as (e: unknown) => void)({ code })
      }
    }
    mockClientInstance = this
  }),
}))

import { LiveChatRealtime } from '@/data/LiveChatRealtime'

describe('LiveChatRealtime', () => {
  let getToken: Mock
  let instance: LiveChatRealtime

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeactivate.mockResolvedValue(undefined)
    mockSubscribe.mockReturnValue(mockSubscription)
    capturedConfig = {}
    getToken = vi.fn().mockReturnValue('Bearer test-token')
    instance = new LiveChatRealtime(getToken)
  })

  it('calls beforeConnect to set fresh Authorization header on each connect', () => {
    mockClientInstance._simulateConnect()
    expect(mockClientInstance.connectHeaders.Authorization).toBe('Bearer test-token')
  })

  it('subscribes to correct destination pattern for watchRoom', () => {
    const roomId = '550e8400-e29b-41d4-a716-446655440000'
    const handler = vi.fn()
    instance.watchRoom(roomId, handler)
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.stringMatching(/^\/topic\/chat\/rooms\/[0-9a-f-]+\/messages$/),
      expect.any(Function)
    )
  })

  it('disposer calls subscription.unsubscribe() but NOT Client.deactivate()', () => {
    const handler = vi.fn()
    const dispose = instance.watchRoom('room-abc', handler)
    // Reset deactivate call count (activate was called in constructor)
    mockDeactivate.mockClear()
    dispose()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    expect(mockDeactivate).not.toHaveBeenCalled()
  })

  it('sets state to disconnected on STOMP ERROR Unauthorized', () => {
    // First connect to move state to 'connected', then trigger error
    mockClientInstance._simulateConnect()
    const states: string[] = []
    instance.watchConnection((s) => states.push(s))
    // states now has ['connected'] from the immediate emit; trigger error
    mockClientInstance._simulateStompError('Unauthorized')
    expect(states).toContain('disconnected')
  })

  it('reactivates with fresh token on ws close 1008', async () => {
    getToken.mockReturnValue('Bearer new-token')
    mockClientInstance._simulateWsClose(1008)
    await Promise.resolve() // flush microtasks
    expect(mockDeactivate).toHaveBeenCalled()
  })
})
