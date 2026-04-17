import { Navigate } from 'react-router-dom'
import { NoAppsPage } from '../../pages/NoAppsPage'
import { useShellStore } from '../model/shell-store'

export function ShellIndexRoute() {
  const defaultApp = useShellStore((state) => state.workspaceConfig?.defaultApp ?? null)

  if (!defaultApp) {
    return <NoAppsPage />
  }

  return <Navigate to={`/apps/${defaultApp}`} replace />
}
