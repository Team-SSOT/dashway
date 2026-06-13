import type { MentionTargetType } from '../types'

/**
 * Canonical per-target-type mention chip colors (Tailwind utility classes).
 *
 * Single source of truth for every surface that renders a mention and must stay
 * visually identical: the read-side chip (`MentionRender`), the editor chip
 * (host app injects this into the headless MentionNode theme), and the mention
 * typeahead. Apps that don't share these Tailwind tokens can override per-node
 * styling via `renderLexical`'s `classes`/`components` options.
 *
 * Tailwind v4 note: these literal class strings must be reachable by each
 * consuming app's content scan. With `@tailwindcss/vite` the package source is
 * in the module graph; apps can also add an explicit `@source` for this package.
 */
export const MENTION_TYPE_CLASSES: Record<MentionTargetType, string> = {
  person: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  document: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  issue: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  team: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  app: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}
