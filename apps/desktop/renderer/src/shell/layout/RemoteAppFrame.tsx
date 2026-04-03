import type { WorkspaceApp } from '@dashway/config-schema'
import { useEffect, useState } from 'react'

interface Props {
  app: WorkspaceApp
}

export function RemoteAppFrame({ app }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoaded(false)
    setLoadError(null)

    console.info('[dashway:shell] opening remote app', {
      appId: app.id,
      title: app.title,
      entryUrl: app.entryUrl,
    })
  }, [app.entryUrl, app.id, app.title])

  return (
    <div className="remote-app">
      {!loaded && !loadError ? (
        <div className="remote-app__state">Opening {app.title}...</div>
      ) : null}

      {loadError ? (
        <div className="remote-app__state">
          Could not open <strong>{app.title}</strong>.
          <br />
          <code>{app.entryUrl}</code>
        </div>
      ) : null}

      <iframe
        key={app.id}
        className="remote-app__frame"
        title={app.title}
        src={app.entryUrl}
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        onLoad={() => {
          setLoaded(true)
          console.info('[dashway:shell] remote app loaded', {
            appId: app.id,
            title: app.title,
            entryUrl: app.entryUrl,
          })
        }}
        onError={() => {
          setLoaded(false)
          setLoadError('Remote app failed to load.')
          console.error('[dashway:shell] remote app failed to load', {
            appId: app.id,
            title: app.title,
            entryUrl: app.entryUrl,
          })
        }}
      />
    </div>
  )
}
