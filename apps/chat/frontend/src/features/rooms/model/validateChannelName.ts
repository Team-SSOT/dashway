/**
 * Pure validation function for channel names.
 * Rules V1–V5 per .omc/plans/chat-frontend-addchannel.md §2.4
 */

export type ValidateChannelNameResult =
  | { ok: true; value: string }
  | { ok: false; code: string; message: string }

/**
 * Normalize a raw channel name input:
 *   - trim
 *   - lowercase
 *   - strip all leading '#'
 *   - prepend exactly one '#'
 *
 * Example: "  General  " → "#general", "##Foo" → "#foo"
 */
export function normalizeChannelName(raw: string): string {
  return '#' + raw.trim().toLowerCase().replace(/^#+/, '')
}

/**
 * Validate a raw channel name against the 5 client-side rules.
 *
 * @param raw         - Raw user input (untrimmed)
 * @param existingNames - Current room names from ['rooms'] cache (any casing)
 */
export function validateChannelName(
  raw: string,
  existingNames: string[],
): ValidateChannelNameResult {
  const trimmed = raw.trim()

  // V1 — non-empty
  if (trimmed.length === 0) {
    return { ok: false, code: 'REQUIRED', message: 'Channel name is required.' }
  }

  // Strip leading '#' for length + regex checks (after trimming)
  const stripped = trimmed.replace(/^#+/, '')

  // V2 — at least 2 characters (after stripping '#')
  if (stripped.length < 2) {
    return { ok: false, code: 'TOO_SHORT', message: 'Must be at least 2 characters.' }
  }

  // V3 — at most 80 characters
  if (stripped.length > 80) {
    return { ok: false, code: 'TOO_LONG', message: 'Must be 80 characters or fewer.' }
  }

  // V4 — lowercase letters, numbers, hyphens, underscores only
  const lowered = stripped.toLowerCase()
  if (!/^[a-z0-9][a-z0-9\-_]*$/.test(lowered)) {
    return {
      ok: false,
      code: 'INVALID_CHARS',
      message: 'Lowercase letters, numbers, hyphens, underscores. No spaces.',
    }
  }

  // V5 — uniqueness check against existing names (case-insensitive, normalized)
  const normalized = normalizeChannelName(raw)
  const existingLower = existingNames.map((n) => n.toLowerCase())
  if (existingLower.includes(normalized.toLowerCase())) {
    return {
      ok: false,
      code: 'DUPLICATE',
      message: 'A channel with this name already exists.',
    }
  }

  return { ok: true, value: normalized }
}
