import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { isShellMode } from '@dashway/app-sdk'
import { useDashwayShell, useShellAuthToken } from '@dashway/app-sdk/react'

export interface AuthTokenContext {
  token: string | null
  memberId: string | null
  version: number
  refresh: () => void
  /**
   * V1.2에서 `dashway:auth.token` 메시지 수신 시 호출.
   * app-protocol 확장 필요 (별도 계획).
   */
  setTokenFromShell: (token: string | null) => void
}

const Context = createContext<AuthTokenContext | null>(null)

function readToken(): string | null {
  try {
    return localStorage.getItem('chatAuthToken')
  } catch {
    return null
  }
}

function decodeMemberIdFromJwt(token: string | null): string | null {
  if (!token) return null
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token
  const parts = raw.split('.')
  if (parts.length < 2) return null
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded + '==='.slice((padded.length + 3) % 4))
    // context-api stores memberId in the JWT 'jti' claim via Jwts.claims().id();
    // some libraries surface the same value as 'id' or 'sub' so we accept all three.
    const payload = JSON.parse(json) as {
      jti?: string | number
      id?: string | number
      sub?: string | number
    }
    const claim = payload.jti ?? payload.id ?? payload.sub
    return claim != null ? String(claim) : null
  } catch {
    return null
  }
}

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [token, setToken] = useState<string | null>(readToken)
  const [version, setVersion] = useState(0)
  const shellClient = useDashwayShell()
  const shellMode = isShellMode()

  const tokenRef = useRef(token)
  tokenRef.current = token

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'chatAuthToken') return
      const next = e.newValue
      setToken(next)
      setVersion((v) => v + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Notify shell when token is absent (session invalid)
  useEffect(() => {
    if (token === null && shellMode) {
      shellClient.notifySessionInvalid()
    }
  }, [token, shellMode, shellClient])

  // V1.2 app-protocol token injection: shell pushes the access token via
  // dashway:auth.token after the iframe handshake. Mirror it into local
  // state and persist for hard reloads inside the same iframe origin.
  useShellAuthToken((next) => {
    setToken(next)
    setVersion((v) => v + 1)
    try {
      if (next === null) localStorage.removeItem('chatAuthToken')
      else localStorage.setItem('chatAuthToken', next)
    } catch {
      /* localStorage may be unavailable inside partitioned iframes */
    }
  })

  const refresh = () => {
    const next = readToken()
    setToken(next)
    setVersion((v) => v + 1)
  }

  const setTokenFromShell = (next: string | null) => {
    setToken(next)
    setVersion((v) => v + 1)
  }

  const memberId = decodeMemberIdFromJwt(token)

  return (
    <Context.Provider value={{ token, memberId, version, refresh, setTokenFromShell }}>
      {token === null && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: 8,
            right: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: '#92400e',
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 4,
            zIndex: 9999,
          }}
        >
          {shellMode
            ? 'shell 토큰 주입 대기 중...'
            : '단독 dev 모드: dev 콘솔에서 localStorage.chatAuthToken 설정 필요.'}
        </div>
      )}
      {children}
    </Context.Provider>
  )
}

export function useAuthToken(): AuthTokenContext {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuthToken must be used within <AuthProvider>')
  return ctx
}
