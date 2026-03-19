import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const shellApi = {
  getBootstrap: () => ipcRenderer.invoke(IPC.SHELL_GET_BOOTSTRAP),
  setTheme: (mode: 'system' | 'light' | 'dark') => ipcRenderer.invoke(IPC.SHELL_SET_THEME, mode),
}
