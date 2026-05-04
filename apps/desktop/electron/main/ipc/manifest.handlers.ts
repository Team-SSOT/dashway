import { ipcMain } from 'electron'
import { IPC } from './channels'

const FETCH_TIMEOUT_MS = 5000

interface ManifestFetchResult {
  ok: boolean
  manifest?: unknown
  error?: string
}

export function registerManifestHandlers(): void {
  ipcMain.handle(
    IPC.APP_MANIFEST_FETCH,
    async (_event, url: unknown): Promise<ManifestFetchResult> => {
      if (typeof url !== 'string' || url.length === 0) {
        return { ok: false, error: 'Invalid manifest URL' }
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })

        if (!response.ok) {
          return { ok: false, error: `Manifest responded ${response.status}` }
        }

        const manifest = await response.json()
        return { ok: true, manifest }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown manifest fetch error'
        return { ok: false, error: message }
      } finally {
        clearTimeout(timer)
      }
    },
  )
}
