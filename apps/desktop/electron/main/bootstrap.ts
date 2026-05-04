import { app } from 'electron'
import { registerAppLifecycle } from './app-lifecycle'
import { createMainWindow } from './create-main-window'
import { registerManifestHandlers } from './ipc/manifest.handlers'
import { registerShellHandlers } from './ipc/shell.handlers'
import { registerSystemHandlers } from './ipc/system.handlers'
import { registerWorkspaceHandlers } from './ipc/workspace.handlers'

// 1. Register all IPC handlers BEFORE window creation
registerShellHandlers()
registerWorkspaceHandlers()
registerSystemHandlers()
registerManifestHandlers()

// 2. Wait for Electron to be ready, then create window
app.whenReady().then(() => {
  createMainWindow()
  registerAppLifecycle()
})
