import {
  type DashwayAppManifest,
  DashwayAppManifestSchema,
  MANIFEST_PATH,
} from '@dashway/app-protocol'

export type ManifestEntry =
  | { status: 'ok'; manifest: DashwayAppManifest }
  | { status: 'error'; error: string }

export interface ManifestFetcher {
  fetch(entryUrl: string): Promise<DashwayAppManifest>
}

export function buildManifestUrl(entryUrl: string): string {
  const base = entryUrl.replace(/\/+$/, '')
  return `${base}${MANIFEST_PATH}`
}

export function createManifestCache(fetcher: ManifestFetcher) {
  const cache = new Map<string, ManifestEntry>()
  const inflight = new Map<string, Promise<ManifestEntry>>()

  const fetchOne = async (appId: string, entryUrl: string): Promise<ManifestEntry> => {
    try {
      const raw = await fetcher.fetch(buildManifestUrl(entryUrl))
      const parsed = DashwayAppManifestSchema.safeParse(raw)
      if (!parsed.success) {
        const entry: ManifestEntry = {
          status: 'error',
          error: `Invalid manifest: ${parsed.error.issues[0]?.message ?? 'schema mismatch'}`,
        }
        cache.set(appId, entry)
        return entry
      }
      const entry: ManifestEntry = { status: 'ok', manifest: parsed.data }
      cache.set(appId, entry)
      return entry
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown manifest fetch error'
      const entry: ManifestEntry = { status: 'error', error: message }
      cache.set(appId, entry)
      return entry
    }
  }

  return {
    get(appId: string): ManifestEntry | undefined {
      return cache.get(appId)
    },
    async load(appId: string, entryUrl: string): Promise<ManifestEntry> {
      const existing = inflight.get(appId)
      if (existing) return existing
      const promise = fetchOne(appId, entryUrl).finally(() => {
        inflight.delete(appId)
      })
      inflight.set(appId, promise)
      return promise
    },
    async loadAll(
      apps: { id: string; entryUrl: string }[],
    ): Promise<Record<string, ManifestEntry>> {
      const results = await Promise.all(
        apps.map(async (app) => [app.id, await this.load(app.id, app.entryUrl)] as const),
      )
      return Object.fromEntries(results)
    },
    invalidate(appId?: string): void {
      if (appId) {
        cache.delete(appId)
        inflight.delete(appId)
      } else {
        cache.clear()
        inflight.clear()
      }
    },
  }
}
