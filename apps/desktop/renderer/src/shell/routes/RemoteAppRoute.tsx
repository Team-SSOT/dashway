import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { NoAppsPage } from '../../pages/NoAppsPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { RemoteAppFrame } from '../layout/RemoteAppFrame'
import { useShellStore } from '../model/shell-store'

export function RemoteAppRoute() {
  const params = useParams()
  const appId = params.appId
  const splat = params['*'] ?? ''
  const { activeAppId, setActiveApp, workspaceConfig } = useShellStore()

  const app = workspaceConfig?.apps.find((candidate) => candidate.id === appId) ?? null

  useEffect(() => {
    if (app && activeAppId !== app.id) {
      setActiveApp(app.id)
    }
  }, [activeAppId, app, setActiveApp])

  if (!workspaceConfig || workspaceConfig.apps.length === 0) {
    return <NoAppsPage />
  }

  if (!app) {
    return <NotFoundPage />
  }

  return <RemoteAppFrame app={app} splat={splat} />
}
