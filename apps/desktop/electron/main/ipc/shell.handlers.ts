import type { BootstrapPayload } from '@dashway/config-schema'
import { ipcMain } from 'electron'
import { IPC } from './channels'

export function registerShellHandlers(): void {
  ipcMain.handle(IPC.SHELL_GET_BOOTSTRAP, (): BootstrapPayload => {
    return {
      workspaceId: 'ws-default',
      userId: 'user-local',
      initialTheme: 'dark',
      workspaces: [
        { id: 'ws-default', name: 'Personal', icon: 'P', color: '#6366f1' },
        { id: 'ws-acme', name: 'Acme Corp', icon: 'A', color: '#3b82f6' },
      ],
    }
  })

  ipcMain.handle(IPC.SHELL_SET_THEME, (_event, _mode: string) => {
    // TODO: persist theme preference
  })
}
