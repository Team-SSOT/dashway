import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const shellApi = {
  getBootstrap: () => ipcRenderer.invoke(IPC.SHELL_GET_BOOTSTRAP),
  login: (input: { email: string; password: string }) => ipcRenderer.invoke(IPC.SHELL_LOGIN, input),
  logout: () => ipcRenderer.invoke(IPC.SHELL_LOGOUT),
  graphql: (request: { query: string; variables?: Record<string, unknown>; operationName?: string }) =>
    ipcRenderer.invoke(IPC.SHELL_GRAPHQL, request),
  setTheme: (mode: 'system' | 'light' | 'dark') => ipcRenderer.invoke(IPC.SHELL_SET_THEME, mode),
}
