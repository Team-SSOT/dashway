import { useDashwayShell, useShellNavigation } from '@dashway/app-sdk/react'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function ShellRouteSync() {
  const navigate = useNavigate()
  const location = useLocation()
  const client = useDashwayShell()
  const lastReportedRef = useRef<string | null>(null)

  // 1. Shell → app: route.navigate 수신
  useShellNavigation((appRoute) => {
    if (appRoute !== location.pathname) {
      navigate(appRoute)
    }
  })

  // 2. App → shell: route.changed 발사
  useEffect(() => {
    if (lastReportedRef.current === location.pathname) return
    lastReportedRef.current = location.pathname
    client.notifyRoute(location.pathname)
  }, [client, location.pathname])

  return null
}
