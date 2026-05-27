import type { ShellSignupInput } from '@dashway/config-schema'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

interface Props {
  error?: string | null
  submitting?: boolean
  onSubmit: (input: ShellSignupInput) => Promise<void>
  onSwitchToSignin: () => void
}

export function SignupPage({ error, submitting = false, onSubmit, onSwitchToSignin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(error ?? null)

  useEffect(() => {
    setFormError(error ?? null)
  }, [error])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!name.trim() || !email.trim() || !password) {
      setFormError('Name, email, and password are required.')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
      })
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Could not complete sign up.'
      setFormError(message)
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
          maxWidth: 420,
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
          Create your account
        </h1>
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--fg-2)',
            lineHeight: 1.6,
          }}
        >
          Sign up to provision a new member, then we'll sign you in and load your workspace.
        </p>

        <label
          htmlFor="name"
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Name
        </label>
        <input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 14,
            border: '1px solid color-mix(in srgb, var(--fg-3) 16%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 86%, transparent)',
            color: 'var(--fg)',
            padding: '0 14px',
            marginBottom: 18,
            outline: 'none',
          }}
        />

        <label
          htmlFor="email"
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 14,
            border: '1px solid color-mix(in srgb, var(--fg-3) 16%, transparent)',
            background: 'color-mix(in srgb, var(--bg) 86%, transparent)',
            color: 'var(--fg)',
            padding: '0 14px',
            marginBottom: 18,
            outline: 'none',
          }}
        />

        <label
          htmlFor="password"
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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

        {formError && (
          <p
            style={{
              margin: '14px 0 0',
              color: '#fca5a5',
              lineHeight: 1.5,
            }}
          >
            {formError}
          </p>
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
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p
          style={{
            margin: '20px 0 0',
            textAlign: 'center',
            color: 'var(--fg-2)',
            fontSize: 14,
          }}
        >
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignin}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#f97316',
              fontWeight: 600,
              cursor: submitting ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}
