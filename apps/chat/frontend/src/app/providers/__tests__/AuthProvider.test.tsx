import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuthToken } from '../AuthProvider'
import { ShellModeProvider } from '@dashway/app-sdk/react'

function TokenDisplay() {
  const { token, memberId, version } = useAuthToken()
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="memberId">{memberId ?? 'null'}</span>
      <span data-testid="version">{version}</span>
    </div>
  )
}

function renderWithShell(shellMode: boolean) {
  if (shellMode) {
    // Make isShellMode() return true: window.parent !== window
    // Provide postMessage stub so ShellModeProvider.start() and notifySessionInvalid() don't throw
    const fakeParent = { postMessage: vi.fn() }
    Object.defineProperty(window, 'parent', { configurable: true, get: () => fakeParent })
  } else {
    Object.defineProperty(window, 'parent', { configurable: true, get: () => window })
  }

  return render(
    <ShellModeProvider appId="chat">
      <AuthProvider>
        <TokenDisplay />
      </AuthProvider>
    </ShellModeProvider>,
  )
}

// Fire a storage event without storageArea (jsdom stub isn't a real Storage instance)
function fireStorageEvent(key: string, newValue: string | null) {
  const event = new StorageEvent('storage', { key, newValue })
  window.dispatchEvent(event)
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    Object.defineProperty(window, 'parent', { configurable: true, get: () => window })
    vi.restoreAllMocks()
  })

  it('returns null token and memberId when localStorage has no chatAuthToken', () => {
    renderWithShell(false)
    expect(screen.getByTestId('token').textContent).toBe('null')
    expect(screen.getByTestId('memberId').textContent).toBe('null')
  })

  it('returns token from localStorage when chatAuthToken is set', () => {
    localStorage.setItem('chatAuthToken', 'tok-abc')
    renderWithShell(false)
    expect(screen.getByTestId('token').textContent).toBe('tok-abc')
  })

  it('shows standalone dev banner when not in shell mode and token is null', () => {
    renderWithShell(false)
    expect(screen.getByRole('alert').textContent).toMatch(/단독 dev 모드/)
  })

  it('shows iframe dev banner when in shell mode and token is null', () => {
    renderWithShell(true)
    expect(screen.getByRole('alert').textContent).toMatch(/shell 토큰 주입 대기 중/)
  })

  it('does not show banner when token is present', () => {
    localStorage.setItem('chatAuthToken', 'tok-xyz')
    renderWithShell(false)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('increments version and updates token on storage event for chatAuthToken', async () => {
    renderWithShell(false)
    const versionBefore = Number(screen.getByTestId('version').textContent)

    await act(async () => {
      fireStorageEvent('chatAuthToken', 'tok-rotated')
    })

    expect(Number(screen.getByTestId('version').textContent)).toBe(versionBefore + 1)
    expect(screen.getByTestId('token').textContent).toBe('tok-rotated')
  })

  it('does not increment version on storage event for unrelated key', async () => {
    renderWithShell(false)
    const versionBefore = Number(screen.getByTestId('version').textContent)

    await act(async () => {
      fireStorageEvent('someOtherKey', 'irrelevant')
    })

    expect(Number(screen.getByTestId('version').textContent)).toBe(versionBefore)
  })

  it('setTokenFromShell updates token and increments version', async () => {
    function SetTokenButton() {
      const { setTokenFromShell, token, version } = useAuthToken()
      return (
        <>
          <button onClick={() => setTokenFromShell('shell-token')}>set</button>
          <span data-testid="token">{token ?? 'null'}</span>
          <span data-testid="version">{version}</span>
        </>
      )
    }

    const { getByRole } = render(
      <ShellModeProvider appId="chat">
        <AuthProvider>
          <SetTokenButton />
        </AuthProvider>
      </ShellModeProvider>,
    )

    const versionBefore = Number(screen.getByTestId('version').textContent)
    await act(async () => {
      getByRole('button', { name: 'set' }).click()
    })

    expect(screen.getByTestId('token').textContent).toBe('shell-token')
    expect(Number(screen.getByTestId('version').textContent)).toBe(versionBefore + 1)
  })
})
