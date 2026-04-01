import { ipcMain } from 'electron'
import { IPC } from './channels'

export function registerSystemHandlers(): void {
  ipcMain.handle(IPC.SYSTEM_GET_PLATFORM, () => {
    return process.platform
  })
}
