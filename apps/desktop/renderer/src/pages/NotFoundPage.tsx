import { useLocation } from 'react-router-dom'

export function NotFoundPage() {
  const location = useLocation()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
        color: 'var(--fg-3)',
      }}
    >
      <div style={{ fontSize: '2rem', fontWeight: 700 }}>404</div>
      <div>
        <code>{location.pathname}</code> not found
      </div>
    </div>
  )
}
