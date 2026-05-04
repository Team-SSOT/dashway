import { contextBridge } from 'electron'
import { appManifestApi } from './api/app-manifest'
import { eventsApi } from './api/events'
import { shellApi } from './api/shell'
import { windowApi } from './api/window'
import { workspaceApi } from './api/workspace'

contextBridge.exposeInMainWorld('desktop', {
  shell: shellApi,
  workspace: workspaceApi,
  window: windowApi,
  events: eventsApi,
  appManifest: appManifestApi,
})
