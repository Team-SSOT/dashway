import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const windowApi = {
  minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
}
