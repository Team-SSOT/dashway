// Minimal jsdom test setup for @dashway/rich-text.
//
// Phase 1 tests are JSON / mutation-tracker only (decision D2): no React render
// tests, no Radix components. We therefore avoid the heavier polyfills used by
// apps/chat/frontend (matchMedia, ResizeObserver, clipboard). Only install
// stubs that the Lexical headless editor may touch under jsdom.

// localStorage stub — jsdom exposes localStorage as a getter that may throw
// when there is no valid origin. Install a working in-memory stub defensively.
const _localStore: Record<string, string> = {}
const _localStorage = {
  getItem: (k: string) => _localStore[k] ?? null,
  setItem: (k: string, v: string) => {
    _localStore[k] = v
  },
  removeItem: (k: string) => {
    delete _localStore[k]
  },
  clear: () => {
    Object.keys(_localStore).forEach((k) => delete _localStore[k])
  },
  get length() {
    return Object.keys(_localStore).length
  },
  key: (i: number) => Object.keys(_localStore)[i] ?? null,
}
try {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: _localStorage,
  })
} catch {
  ;(window as unknown as Record<string, unknown>).localStorage = _localStorage
}
