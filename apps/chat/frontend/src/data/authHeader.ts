/**
 * Build the value for the `Authorization` header from a stored token.
 *
 * context-api's TokenService strips and *requires* the `Bearer ` prefix
 * (TokenService.kt: `tokenWithPrefix.removePrefix("Bearer ")`, and it throws
 * when the prefix is missing). The desktop shell injects a *raw* JWT
 * (sessionStore.accessToken has no prefix), so we normalize at the send site.
 *
 * Idempotent: a token that already carries `Bearer ` is returned unchanged.
 * An empty/blank token yields '' so callers send no credentials.
 */
export function toAuthorizationHeader(token: string | null): string {
  if (!token) return ''
  const trimmed = token.trim()
  if (trimmed.length === 0) return ''
  return /^Bearer\s/i.test(trimmed) ? trimmed : `Bearer ${trimmed}`
}
