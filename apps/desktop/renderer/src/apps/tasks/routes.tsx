import type { RouteObject } from 'react-router-dom'

function TaskBoardPage() {
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
        Tasks
      </h2>
      <p style={{ color: 'var(--fg-2)' }}>No tasks yet.</p>
    </div>
  )
}

export const routes = (): RouteObject[] => [
  {
    path: '/tasks',
    element: <TaskBoardPage />,
  },
]
