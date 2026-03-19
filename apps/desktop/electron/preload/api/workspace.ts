import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const workspaceApi = {
  getConfig: () => ipcRenderer.invoke(IPC.WORKSPACE_GET_CONFIG),

  switchWorkspace: (workspaceId: string) => ipcRenderer.invoke(IPC.WORKSPACE_SWITCH, workspaceId),

  onConfigChanged: (callback: (config: unknown) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, config: unknown) => callback(config)
    ipcRenderer.on(IPC.WORKSPACE_CONFIG_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC.WORKSPACE_CONFIG_CHANGED, handler)
  },
}
