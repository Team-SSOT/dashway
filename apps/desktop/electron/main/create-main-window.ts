import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import { IPC } from './ipc/channels'
import { windowManager } from './window-manager'

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
      preload: join(__dirname, '../preload/index.js'),
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

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  windowManager.setMainWindow(win)
  return win
}
