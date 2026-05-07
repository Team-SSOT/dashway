import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export const shellApi = {
  getBootstrap: () => ipcRenderer.invoke(IPC.SHELL_GET_BOOTSTRAP),
  login: (input: { email: string; password: string }) => ipcRenderer.invoke(IPC.SHELL_LOGIN, input),
  signup: (input: { name: string; email: string; password: string }) =>
    ipcRenderer.invoke(IPC.SHELL_SIGNUP, input),
  logout: () => ipcRenderer.invoke(IPC.SHELL_LOGOUT),
  graphql: (request: { query: string; variables?: Record<string, unknown>; operationName?: string }) =>
    ipcRenderer.invoke(IPC.SHELL_GRAPHQL, request),
  setTheme: (mode: 'system' | 'light' | 'dark') => ipcRenderer.invoke(IPC.SHELL_SET_THEME, mode),
  getServerUrl: () => ipcRenderer.invoke(IPC.SHELL_GET_SERVER_URL),
  setServerUrl: (url: string) => ipcRenderer.invoke(IPC.SHELL_SET_SERVER_URL, url),
  probeServer: (url: string) => ipcRenderer.invoke(IPC.SHELL_PROBE_SERVER, url),
}
