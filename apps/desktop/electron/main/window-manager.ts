import type { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null

export const windowManager = {
  getMainWindow(): BrowserWindow | null {
    return mainWindow
  },

  setMainWindow(win: BrowserWindow): void {
    mainWindow = win
    win.on('closed', () => {
      mainWindow = null
    })
  },
}
