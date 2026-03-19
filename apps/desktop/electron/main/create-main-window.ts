import { join } from 'node:path'
import { BrowserWindow, shell } from 'electron'
import { IPC } from './ipc/channels'
import { windowManager } from './window-manager'

// Declared by @electron-forge/plugin-vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#09090e',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, 'index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('focus', () => {
    win.webContents.send(IPC.EVENT_WINDOW_FOCUS)
  })

  win.on('blur', () => {
    win.webContents.send(IPC.EVENT_WINDOW_BLUR)
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  windowManager.setMainWindow(win)
  return win
}
