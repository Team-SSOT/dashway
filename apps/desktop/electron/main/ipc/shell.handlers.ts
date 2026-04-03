import type {
  ShellBootstrapReadyResult,
  ShellGraphqlRequest,
  ShellLoginInput,
  ThemeMode,
} from '@dashway/config-schema'
import { ipcMain } from 'electron'
import { buildShellBootstrap } from '../services/shell-bootstrap'
import { configStore } from '../services/config-store'
import { contextApiClient } from '../services/context-api-client'
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

  ipcMain.handle(IPC.SHELL_LOGOUT, async () => {
    await contextApiClient.logout()
  })

  ipcMain.handle(IPC.SHELL_GRAPHQL, async (_event, request: ShellGraphqlRequest) => {
    return contextApiClient.graphql(request)
  })

  ipcMain.handle(IPC.SHELL_SET_THEME, (_event, mode: ThemeMode) => {
    configStore.set<ThemeMode>('theme', mode)
  })
}
