interface Props {
  message?: string
}

export function BootingPage({ message = 'Loading your workspace...' }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg-3)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        letterSpacing: '-0.02em',
      }}
    >
      <div
        style={{
          fontSize: '1.6rem',
          color: 'var(--fg)',
          fontWeight: 700,
        }}
      >
        dashway
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: '0.95rem',
          color: 'var(--fg-3)',
        }}
      >
        {message}
      </div>
    </div>
  )
}
