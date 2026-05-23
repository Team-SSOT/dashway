import '@testing-library/jest-dom'

// ResizeObserver polyfill for Radix ScrollArea
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// localStorage stub — jsdom exposes localStorage as a getter that may throw
// when there is no valid origin (e.g., about:blank). Unconditionally install
// a working in-memory stub so uiStore initialTheme() doesn't crash.
const _localStore: Record<string, string> = {}
const _localStorage = {
  getItem: (k: string) => _localStore[k] ?? null,
  setItem: (k: string, v: string) => { _localStore[k] = v },
  removeItem: (k: string) => { delete _localStore[k] },
  clear: () => { Object.keys(_localStore).forEach((k) => delete _localStore[k]) },
  get length() { return Object.keys(_localStore).length },
  key: (i: number) => Object.keys(_localStore)[i] ?? null,
}
try {
  Object.defineProperty(window, 'localStorage', { writable: true, configurable: true, value: _localStorage })
} catch {
  // already defined non-configurable — assign directly
  ;(window as unknown as Record<string, unknown>).localStorage = _localStorage
}

// navigator.clipboard stub — jsdom doesn't ship one. Tests can vi.spyOn this.
if (!('clipboard' in navigator)) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {},
      readText: async () => '',
    },
  })
}

// matchMedia polyfill for uiStore initialTheme
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
