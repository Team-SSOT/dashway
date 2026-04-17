import { useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'

export function useWorkspaceSwitch() {
  const navigate = useNavigate()

  return async (workspaceId: string) => {
    const { activeWorkspaceId, setActiveWorkspace, setWorkspaceConfig, setActiveApp } =
      useShellStore.getState()

    if (workspaceId === activeWorkspaceId) return

    const config = await window.desktop.workspace.switchWorkspace(workspaceId)
    setActiveWorkspace(workspaceId)
    setWorkspaceConfig(config)
    setActiveApp(config.defaultApp)

    if (config.defaultApp) {
      navigate(`/apps/${config.defaultApp}`)
      return
    }

    navigate('/')
  }
}
