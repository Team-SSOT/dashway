import { describe, it, expect } from 'vitest'

describe('useIsLive', () => {
  it('returns false when VITE_CHAT_DATA_SOURCE is not set', async () => {
    // Default vitest env has no VITE_CHAT_DATA_SOURCE → mock env is undefined → 'mock' path
    const { useIsLive } = await import('./featureFlags')
    // import.meta.env.VITE_CHAT_DATA_SOURCE is undefined in test env → !== 'live' → false
    expect(useIsLive()).toBe(false)
  })
})
