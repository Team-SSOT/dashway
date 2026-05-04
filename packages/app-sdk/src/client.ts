import {
  type MessageToApp,
  MessageToAppSchema,
  type MessageToShell,
  type PatchOp,
  PROTOCOL_VERSION,
  type SidebarSpec,
  type ThemeMode,
} from '@dashway/app-protocol'

export interface DashwayAppClient {
  isShellMode(): boolean
  start(): void
  publishSidebar(sidebar: SidebarSpec): void
  patchSidebar(ops: PatchOp[]): void
  notifyRoute(appRoute: string): void
  notifySessionInvalid(): void
  onNavigate(handler: (appRoute: string) => void): () => void
  onThemeChange(handler: (mode: ThemeMode) => void): () => void
  destroy(): void
}

export interface DashwayAppClientOptions {
  appId: string
}

export function isShellMode(): boolean {
  return typeof window !== 'undefined' && window.parent !== window
}

export function createDashwayAppClient(options: DashwayAppClientOptions): DashwayAppClient {
  const { appId } = options
  const navHandlers = new Set<(appRoute: string) => void>()
  const themeHandlers = new Set<(mode: ThemeMode) => void>()
  let started = false
  let listenerAttached = false

  const send = (message: MessageToShell): void => {
    if (!isShellMode()) return
    window.parent.postMessage(message, '*')
  }

  const handleMessage = (event: MessageEvent): void => {
    if (event.source !== window.parent) return
    const parsed = MessageToAppSchema.safeParse(event.data)
    if (!parsed.success) return
    const message: MessageToApp = parsed.data

    switch (message.type) {
      case 'dashway:hello.ack':
        break
      case 'dashway:route.navigate':
        console.info('[dashway:app] received navigate', {
          appRoute: message.appRoute,
          handlers: navHandlers.size,
        })
        for (const handler of navHandlers) handler(message.appRoute)
        break
      case 'dashway:theme.changed':
        for (const handler of themeHandlers) handler(message.mode)
        break
    }
  }

  return {
    isShellMode,

    /**
     * Listener를 부착하고 hello를 보낸다.
     * 반드시 자식 컴포넌트들이 onNavigate/onThemeChange를 등록한 *후*에 호출되어야 한다.
     * (React effect 순서로 자연스럽게 보장 — children effect → parent effect)
     */
    start() {
      if (started || typeof window === 'undefined') return
      started = true
      if (!listenerAttached) {
        window.addEventListener('message', handleMessage)
        listenerAttached = true
      }
      if (isShellMode()) {
        console.info('[dashway:app] client started, sending hello', { appId })
        send({ type: 'dashway:hello', protocolVersion: PROTOCOL_VERSION, appId })
      } else {
        console.info('[dashway:app] standalone mode (no parent window)', { appId })
      }
    },

    publishSidebar(sidebar) {
      send({ type: 'dashway:sidebar.replace', appId, sidebar })
    },
    patchSidebar(ops) {
      if (ops.length === 0) return
      send({ type: 'dashway:sidebar.patch', appId, ops })
    },
    notifyRoute(appRoute) {
      send({ type: 'dashway:route.changed', appId, appRoute })
    },
    notifySessionInvalid() {
      send({ type: 'dashway:session.invalid', appId })
    },
    onNavigate(handler) {
      navHandlers.add(handler)
      return () => {
        navHandlers.delete(handler)
      }
    },
    onThemeChange(handler) {
      themeHandlers.add(handler)
      return () => {
        themeHandlers.delete(handler)
      }
    },
    destroy() {
      if (typeof window !== 'undefined' && listenerAttached) {
        window.removeEventListener('message', handleMessage)
        listenerAttached = false
      }
      navHandlers.clear()
      themeHandlers.clear()
      started = false
    },
  }
}
