interface Props {
  error: string
  onRetry: () => void
  onLogout: () => void
}

export function BootErrorPage({ error, onRetry, onLogout }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          border: '1px solid color-mix(in srgb, var(--fg-3) 18%, transparent)',
          borderRadius: 24,
          padding: 28,
          background: 'color-mix(in srgb, var(--bg-elevated, #11131a) 88%, transparent)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.28)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--fg-3)',
          }}
        >
          dashway shell
        </p>
        <h1
          style={{
            margin: '12px 0 10px',
            fontSize: '1.75rem',
            letterSpacing: '-0.04em',
          }}
        >
          Could not load your workspace
        </h1>
        <p
          style={{
            margin: 0,
            color: 'var(--fg-2)',
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={onRetry}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 14,
              border: 'none',
              background: '#f97316',
              color: '#140d05',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 14,
              border: '1px solid color-mix(in srgb, var(--fg-3) 18%, transparent)',
              background: 'transparent',
              color: 'var(--fg)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
