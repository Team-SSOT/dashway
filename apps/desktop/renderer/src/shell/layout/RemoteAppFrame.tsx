import type { WorkspaceApp } from '@dashway/config-schema'
import { attachIframe, getOriginFromUrl, type IframeHost } from '@dashway/shell-runtime'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'

interface Props {
  app: WorkspaceApp
  splat: string
}

function splatToAppRoute(splat: string): string {
  return splat.length === 0 ? '/' : `/${splat.replace(/^\/+/, '')}`
}

function joinAppRoute(appId: string, appRoute: string): string {
  const trimmed = appRoute.replace(/^\/+/, '')
  return trimmed.length === 0 ? `/apps/${appId}` : `/apps/${appId}/${trimmed}`
}

export function RemoteAppFrame({ app, splat }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const hostRef = useRef<IframeHost | null>(null)
  const targetRouteRef = useRef<string>(splatToAppRoute(splat))
  const lastSentRef = useRef<string | null>(null)
  const lastReceivedRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const navigate = useNavigate()
  const setAppRoute = useShellStore((s) => s.setAppRoute)

  const targetAppRoute = splatToAppRoute(splat)
  targetRouteRef.current = targetAppRoute

  // ① iframe host attach: app 단위로 안정. URL 변경에는 재구동 X.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    setLoaded(false)
    setLoadError(null)
    lastSentRef.current = null
    lastReceivedRef.current = null

    console.info('[dashway:shell] opening remote app', {
      appId: app.id,
      title: app.title,
      entryUrl: app.entryUrl,
    })

    const host = attachIframe({
      appId: app.id,
      iframe,
      expectedOrigin: getOriginFromUrl(app.entryUrl),
      onHello: () => {
        console.info('[dashway:shell] handshake', { appId: app.id })
        // 핸드셰이크 직후 현재 URL 라우트 동기화
        const route = targetRouteRef.current
        host.navigate(route)
        lastSentRef.current = route
        // Forward shell session token to the iframe so apps don't need
        // operator-pasted localStorage entries (V1.2 dashway:auth.token).
        const desktop = (window as unknown as { desktop?: { shell?: { getAccessToken?: () => Promise<string | null> } } }).desktop
        if (desktop?.shell?.getAccessToken) {
          void desktop.shell.getAccessToken().then((token) => {
            host.setAuthToken(token)
          }).catch((err) => {
            console.warn('[dashway:shell] failed to read accessToken', err)
          })
        }
      },
      onRouteChanged: (appRoute) => {
        lastReceivedRef.current = appRoute
        setAppRoute(app.id, appRoute)
        // iframe 내부 라우팅 → shell URL을 미러링
        const next = joinAppRoute(app.id, appRoute)
        const current = window.location.hash.replace(/^#/, '') || '/'
        if (current !== next) {
          navigate(next, { replace: true })
        }
      },
    })
    hostRef.current = host

    return () => {
      host.destroy()
      hostRef.current = null
    }
  }, [app.id, app.entryUrl, navigate, setAppRoute])

  // ② URL splat 변경 시 iframe에 navigate 송신.
  //    핸드셰이크 전/후 무관하게 시도(미수신은 onHello가 한 번 더 보냄).
  //    shell 내부 라우팅(클릭, 명령 등)으로 인한 변경에 반응.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (lastSentRef.current === targetAppRoute) return
    // iframe이 막 보낸 route.changed로 인해 onRouteChanged → navigate(URL replace) → 이 effect 재실행이 일어남.
    // 그 경우 lastReceivedRef === targetAppRoute이므로 재송신 스킵 (loop 방지).
    if (lastReceivedRef.current === targetAppRoute) {
      lastSentRef.current = targetAppRoute
      return
    }
    host.navigate(targetAppRoute)
    lastSentRef.current = targetAppRoute
  }, [targetAppRoute])

  return (
    <div className="remote-app">
      {!loaded && !loadError ? (
        <div className="remote-app__state">Opening {app.title}...</div>
      ) : null}

      {loadError ? (
        <div className="remote-app__state">
          Could not open <strong>{app.title}</strong>.
          <br />
          <code>{app.entryUrl}</code>
        </div>
      ) : null}

      <iframe
        ref={iframeRef}
        key={app.id}
        className="remote-app__frame"
        title={app.title}
        src={app.entryUrl}
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        onLoad={() => {
          setLoaded(true)
          console.info('[dashway:shell] remote app loaded', {
            appId: app.id,
            title: app.title,
            entryUrl: app.entryUrl,
          })
        }}
        onError={() => {
          setLoaded(false)
          setLoadError('Remote app failed to load.')
          console.error('[dashway:shell] remote app failed to load', {
            appId: app.id,
            title: app.title,
            entryUrl: app.entryUrl,
          })
        }}
      />
    </div>
  )
}
