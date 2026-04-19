import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('issueTracker', {
  isElectron: true,
  platform: process.platform,
  versions: process.versions,
})
