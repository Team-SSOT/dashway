export function NoAppsPage() {
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
      <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>No apps available</div>
      <div>The shell is connected, but there are no enabled remote apps to open.</div>
    </div>
  )
}
