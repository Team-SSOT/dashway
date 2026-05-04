import { DashwayAppManifestSchema } from '@dashway/app-protocol'
import type { WorkspaceApp } from '@dashway/config-schema'
import { buildManifestUrl } from '@dashway/shell-runtime'
import { useEffect } from 'react'
import { useShellStore } from '../model/shell-store'

export function useManifestLoader(apps: WorkspaceApp[]): void {
  const fingerprint = apps.map((a) => `${a.id}|${a.entryUrl}`).join(',')

  useEffect(() => {
    let cancelled = false

    const loadOne = async (app: WorkspaceApp): Promise<void> => {
      const existing = useShellStore.getState().manifests[app.id]
      // pending 상태는 StrictMode/cleanup 중일 수 있으니 재시도 허용. ok/error는 캐시 적중.
      if (existing && existing.status !== 'pending') return

      const setManifest = useShellStore.getState().setManifest
      setManifest(app.id, { status: 'pending' })

      try {
        const result = await window.desktop.appManifest.fetch(buildManifestUrl(app.entryUrl))
        if (cancelled) return
        if (!result.ok) {
          setManifest(app.id, { status: 'error', error: result.error ?? 'Unknown error' })
          return
        }
        const parsed = DashwayAppManifestSchema.safeParse(result.manifest)
        if (!parsed.success) {
          setManifest(app.id, {
            status: 'error',
            error: `Invalid manifest: ${parsed.error.issues[0]?.message ?? 'schema mismatch'}`,
          })
          return
        }
        setManifest(app.id, { status: 'ok', manifest: parsed.data })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Unknown manifest fetch error'
        setManifest(app.id, { status: 'error', error: message })
      }
    }

    Promise.all(apps.map(loadOne)).catch(() => {
      // 개별 loadOne이 자체 처리하므로 여기 도달할 일은 거의 없음
    })

    return () => {
      cancelled = true
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: fingerprint encodes apps identity
  }, [fingerprint])
}
