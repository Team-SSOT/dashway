import type { WorkspaceConfig } from '@dashway/config-schema'
import { ipcMain } from 'electron'
import { sessionStore } from '../services/session-store'
import { IPC } from './channels'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle(IPC.WORKSPACE_GET_CONFIG, (): WorkspaceConfig => {
    const workspaceConfig = sessionStore.get().workspaceConfig

    if (!workspaceConfig) {
      throw new Error('Workspace config has not been loaded yet.')
    }

    return workspaceConfig
  })

  ipcMain.handle(IPC.WORKSPACE_SWITCH, (_event, workspaceId: string): WorkspaceConfig => {
    const { workspaces, workspaceConfig } = sessionStore.get()

    if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
      throw new Error(`Workspace ${workspaceId} was not found.`)
    }

    if (!workspaceConfig) {
      throw new Error('Workspace config has not been loaded yet.')
    }

    sessionStore.setActiveWorkspace(workspaceId)
    sessionStore.setWorkspaceConfig(workspaceConfig)
    return workspaceConfig
  })
}
