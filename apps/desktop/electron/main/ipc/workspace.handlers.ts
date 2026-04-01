import type { WorkspaceConfig } from '@dashway/config-schema'
import { ipcMain } from 'electron'
import { IPC } from './channels'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle(IPC.WORKSPACE_GET_CONFIG, (): WorkspaceConfig => {
    return {
      enabledApps: ['home', 'chat', 'tasks'],
      navOrder: ['home', 'chat', 'tasks'],
      defaultApp: 'home',
      theme: 'dark',
    }
  })

  ipcMain.handle(IPC.WORKSPACE_SWITCH, (_event, _workspaceId: string): WorkspaceConfig => {
    // TODO: load per-workspace config from disk/remote
    return {
      enabledApps: ['home', 'chat', 'tasks'],
      navOrder: ['home', 'chat', 'tasks'],
      defaultApp: 'home',
      theme: 'dark',
    }
  })
}
