import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const eventsApi = {
  onDeepLink: (callback: (url: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) => callback(url)
    ipcRenderer.on(IPC.EVENT_DEEP_LINK, handler)
    return () => ipcRenderer.removeListener(IPC.EVENT_DEEP_LINK, handler)
  },

  onWindowFocus: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC.EVENT_WINDOW_FOCUS, handler)
    return () => ipcRenderer.removeListener(IPC.EVENT_WINDOW_FOCUS, handler)
  },

  onWindowBlur: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC.EVENT_WINDOW_BLUR, handler)
    return () => ipcRenderer.removeListener(IPC.EVENT_WINDOW_BLUR, handler)
  },
}
