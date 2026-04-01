import type { RouteObject } from 'react-router-dom'
import { useShellStore } from '../../shell/model/shell-store'

function HomePage() {
  const { workspaces, activeWorkspaceId } = useShellStore()
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId)
  const name = activeWorkspace?.name ?? 'dash'

  return (
    <div style={{ padding: 24 }}>
      <h2
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          marginBottom: 8,
        }}
      >
        Welcome to {name}-way
      </h2>
      <p style={{ color: 'var(--fg-2)' }}>Your workspace is ready.</p>
    </div>
  )
}

export const routes = (): RouteObject[] => [
  {
    path: '/home',
    element: <HomePage />,
  },
]
