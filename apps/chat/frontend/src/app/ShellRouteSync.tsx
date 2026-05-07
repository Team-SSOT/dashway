import { useDashwayShell, useShellNavigation } from '@dashway/app-sdk/react'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function ShellRouteSync() {
  const navigate = useNavigate()
  const location = useLocation()
  const client = useDashwayShell()
  const lastReportedRef = useRef<string | null>(null)

  useShellNavigation((appRoute) => {
    if (appRoute !== location.pathname) {
      navigate(appRoute)
    }
  })

  useEffect(() => {
    if (lastReportedRef.current === location.pathname) return
    lastReportedRef.current = location.pathname
    client.notifyRoute(location.pathname)
  }, [client, location.pathname])

  return null
}
