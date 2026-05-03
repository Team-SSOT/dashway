import { ipcRenderer } from 'electron'
import { IPC } from '../../main/ipc/channels'

export interface AppManifestFetchResult {
  ok: boolean
  manifest?: unknown
  error?: string
}

export const appManifestApi = {
  fetch: (url: string): Promise<AppManifestFetchResult> =>
    ipcRenderer.invoke(IPC.APP_MANIFEST_FETCH, url),
}
