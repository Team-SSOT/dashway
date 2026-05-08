import {
  type MessageToApp,
  type MessageToShell,
  MessageToShellSchema,
  type PatchOp,
  PROTOCOL_VERSION,
  type SidebarSpec,
  type ThemeMode,
} from '@dashway/app-protocol'

export interface IframeHostOptions {
  appId: string
  iframe: HTMLIFrameElement
  expectedOrigin: string
  onSidebarReplace?: (sidebar: SidebarSpec) => void
  onSidebarPatch?: (ops: PatchOp[]) => void
  onRouteChanged?: (appRoute: string) => void
  onSessionInvalid?: () => void
  onHello?: () => void
}

export interface IframeHost {
  navigate(appRoute: string): void
  setTheme(mode: ThemeMode): void
  setAuthToken(token: string | null): void
  destroy(): void
}

export function attachIframe(options: IframeHostOptions): IframeHost {
  const {
    appId,
    iframe,
    expectedOrigin,
    onSidebarReplace,
    onSidebarPatch,
    onRouteChanged,
    onSessionInvalid,
    onHello,
  } = options

  const send = (message: MessageToApp): void => {
    const target = iframe.contentWindow
    if (!target) return
    // 보안 모델: iframe 초기 단계(about:blank)에서는 origin이 부모와 같아 strict origin이
    // 거부됨. 보낸 후 도달 보장은 iframe-side의 event.source 검증으로 충분하므로 '*' 사용.
    // 들어오는 방향은 여전히 expectedOrigin으로 검증(아래).
    target.postMessage(message, '*')
  }

  const handleMessage = (event: MessageEvent): void => {
    // diagnostic: dashway-shaped 데이터인지만 우선 봄
    const looksLikeDashway =
      typeof event.data === 'object' &&
      event.data !== null &&
      typeof (event.data as { type?: unknown }).type === 'string' &&
      (event.data as { type: string }).type.startsWith('dashway:')
    if (looksLikeDashway) {
      console.info('[dashway:shell] raw inbound', {
        type: (event.data as { type: string }).type,
        origin: event.origin,
        sourceMatches: event.source === iframe.contentWindow,
        expectedOrigin,
      })
    }

    // 격리 1: 이 핸들러는 우리 iframe의 contentWindow에서 온 메시지만 처리.
    if (event.source !== iframe.contentWindow) return
    // 격리 2: 검증된 origin만 허용.
    if (expectedOrigin !== '*' && event.origin !== expectedOrigin) return

    const parsed = MessageToShellSchema.safeParse(event.data)
    if (!parsed.success) {
      if (looksLikeDashway) {
        console.warn('[dashway:shell] schema parse failed', parsed.error.issues)
      }
      return
    }
    const message: MessageToShell = parsed.data
    // message.appId는 trace/log용. iframe-by-iframe 격리는 위 두 가드로 충분.
    void appId

    console.info('[dashway:shell] received', { type: message.type, appId: message.appId })

    switch (message.type) {
      case 'dashway:hello':
        send({ type: 'dashway:hello.ack', shellVersion: PROTOCOL_VERSION })
        onHello?.()
        break
      case 'dashway:sidebar.replace':
        onSidebarReplace?.(message.sidebar)
        break
      case 'dashway:sidebar.patch':
        onSidebarPatch?.(message.ops)
        break
      case 'dashway:route.changed':
        onRouteChanged?.(message.appRoute)
        break
      case 'dashway:session.invalid':
        onSessionInvalid?.()
        break
    }
  }

  window.addEventListener('message', handleMessage)

  return {
    navigate(appRoute) {
      console.info('[dashway:shell] sending navigate', { appRoute })
      send({ type: 'dashway:route.navigate', appRoute })
    },
    setTheme(mode) {
      send({ type: 'dashway:theme.changed', mode })
    },
    setAuthToken(token) {
      send({ type: 'dashway:auth.token', token })
    },
    destroy() {
      window.removeEventListener('message', handleMessage)
    },
  }
}

export function getOriginFromUrl(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return '*'
  }
}
