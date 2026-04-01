import { app } from 'electron'
import { createMainWindow } from './create-main-window'
import { windowManager } from './window-manager'

export function registerAppLifecycle(): void {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (windowManager.getMainWindow() === null) {
      createMainWindow()
    }
  })
}
