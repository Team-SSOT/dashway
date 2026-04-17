import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

interface Props {
  initialUrl?: string
  onSubmit: (url: string) => Promise<void>
}

const PLACEHOLDER = 'http://localhost:8080/graphql'

export function ServerUrlOnboardingPage({ initialUrl, onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl)
    }
  }, [initialUrl])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Server URL is required.')
      return
    }

    try {
      new URL(trimmed)
    } catch {
      setError('Enter a valid URL (e.g. http://localhost:8080/graphql).')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(trimmed)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not reach the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at top, rgba(249, 115, 22, 0.24), transparent 34%), var(--bg)',
        color: 'var(--fg)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 30,
          borderRadius: 28,
          border: '1px solid color-mix(in srgb, var(--fg-3) 18%, transparent)',
          background: 'color-mix(in srgb, var(--bg-elevated, #11131a) 92%, transparent)',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.34)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fg-3)',
          }}
        >
          dashway shell
        </p>
        <h1
          style={{
            margin: '12px 0 8px',
            fontSize: '2rem',
            lineHeight: 1.05,
            letterSpacing: '-0.05em',
          }}
        >
          Connect to your server
        </h1>
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--fg-2)',
            lineHeight: 1.6,
          }}
        >
          Point the shell at the context API endpoint. The shell will probe it before continuing
          to sign-in.
        </p>

        <label
          htmlFor="server-url"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}
        >
          Context API URL
        </label>
        <input
          id="server-url"
          autoComplete="off"
          spellCheck={false}
          placeholder={PLACEHOLDER}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={submitting}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 14,
            border: '1px solid color-mix(in srgb, var(--fg-3) 16%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 86%, transparent)',
            color: 'var(--fg)',
            padding: '0 14px',
            outline: 'none',
          }}
        />

        {error && (
          <p style={{ margin: '14px 0 0', color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            height: 48,
            marginTop: 24,
            borderRadius: 14,
            border: 'none',
            background: submitting ? '#fdba74' : '#f97316',
            color: '#1c1208',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Connecting...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
