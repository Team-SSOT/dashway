import type {
  ShellBootstrapReadyResult,
  ShellGraphqlRequest,
  ShellLoginInput,
  ShellMember,
  ShellSignupInput,
  ThemeMode,
} from '@dashway/config-schema'
import { ipcMain } from 'electron'
import { buildShellBootstrap } from '../services/shell-bootstrap'
import { configStore } from '../services/config-store'
import { sessionStore } from '../services/session-store'
import {
  contextApiClient,
  getStoredContextApiUrl,
  probeContextApiUrl,
  setStoredContextApiUrl,
} from '../services/context-api-client'
import { IPC } from './channels'

export function registerShellHandlers(): void {
  ipcMain.handle(IPC.SHELL_GET_BOOTSTRAP, async () => {
    return buildShellBootstrap()
  })

  ipcMain.handle(IPC.SHELL_LOGIN, async (_event, input: ShellLoginInput): Promise<ShellBootstrapReadyResult> => {
    await contextApiClient.login(input)

    const bootstrap = await buildShellBootstrap()

    if (bootstrap.status !== 'ready') {
      throw new Error('Login did not produce a ready shell bootstrap.')
    }

    return bootstrap
  })

  ipcMain.handle(IPC.SHELL_SIGNUP, async (_event, input: ShellSignupInput): Promise<ShellMember> => {
    return contextApiClient.signup(input)
  })

  ipcMain.handle(IPC.SHELL_LOGOUT, async () => {
    await contextApiClient.logout()
  })

  ipcMain.handle(IPC.SHELL_GRAPHQL, async (_event, request: ShellGraphqlRequest) => {
    return contextApiClient.graphql(request)
  })

  ipcMain.handle(IPC.SHELL_SET_THEME, (_event, mode: ThemeMode) => {
    configStore.set<ThemeMode>('theme', mode)
  })

  ipcMain.handle(IPC.SHELL_GET_SERVER_URL, () => {
    return getStoredContextApiUrl()
  })

  ipcMain.handle(IPC.SHELL_SET_SERVER_URL, (_event, url: string) => {
    setStoredContextApiUrl(url.trim())
  })

  ipcMain.handle(IPC.SHELL_PROBE_SERVER, async (_event, url: string) => {
    return probeContextApiUrl(url.trim())
  })

  ipcMain.handle(IPC.SHELL_GET_ACCESS_TOKEN, (): string | null => {
    return sessionStore.get().accessToken
  })
}
