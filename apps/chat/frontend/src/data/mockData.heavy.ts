/**
 * Heavy dataset factory for virtualization spike (FE-M2).
 *
 * NOT auto-loaded. Trigger at runtime via:
 *   window.__chatMocks.loadHeavyDataset()
 * or URL flag `?heavy=1` (handled in DataSourceProvider).
 *
 * Generates 1,000 messages with mixed content types and heights so we can
 * stress-test TanStack Virtual's dynamic measurement + bottom-anchor + prepend.
 */

import type { SerializedEditorState } from 'lexical'
import type { ChatMessage, ChatRoom } from '@/types/chat'
import {
  MOCK_MEMBERS,
  simpleText,
  boldText,
  codeBlock,
  linkText,
} from '@/data/mockData'

export const HEAVY_ROOM_ID = 'heavy'

export const MOCK_ROOMS_HEAVY: ChatRoom = {
  id: HEAVY_ROOM_ID,
  type: 'CHANNEL',
  name: '#heavy-load',
  description: '1,000-message virtualization stress test',
  topic: 'FE-M2 virtualization spike — do not use for real conversation',
  memberCount: MOCK_MEMBERS.length,
  unreadCount: 0,
  lastMessageAt: undefined,
  createdAt: new Date(Date.UTC(2025, 0, 10, 0, 0, 0)).toISOString(),
  updatedAt: new Date(Date.UTC(2025, 0, 13, 23, 59, 0)).toISOString(),
  version: 1,
}

// ─── Deterministic PRNG (mulberry32) so the dataset is reproducible ───────────

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Content templates ───────────────────────────────────────────────────────

const SHORT_LINES = [
  'Good morning team!',
  'Quick update on the deployment.',
  'Anyone free for a pairing session?',
  'Ticket closed, moving on.',
  'Nice work on the refactor.',
  'Coffee?',
  'See you after standup.',
  'Pushed the fix — please review.',
  'Back from lunch, catching up.',
  'Logs look clean, all green.',
  'Rerunning CI now.',
  'Got it, thanks!',
  'Merging once CI passes.',
  'Let me take a look.',
  'Works on my machine 🤷',
]

const MEDIUM_PARAGRAPHS = [
  'I spent the morning digging into the race condition in the message reducer. Turns out the optimistic update was colliding with the realtime event handler on slow networks. Fixed by keying off clientMsgId first, then server id.',
  "Design review takeaways: we're narrowing the sidebar to 240px, pushing the composer to a floating variant on mobile, and introducing a new 'muted' state for channels. Details are in the Figma file, will drop the link in #design.",
  'Quick retrospective: last sprint we shipped 12 tickets, 2 carry over. Main blocker was the Lexical upgrade breaking our walker fixtures — that cost us a day. Mitigation: pin exact versions + enforce fixture regression in CI.',
  'Ops update: we rolled out the new log pipeline last night. Query latency dropped from ~800ms to ~120ms P50. Still watching for edge cases on high-cardinality fields but initial signals are good.',
  "Heads up: I'll be out tomorrow for a personal appointment. If anything urgent comes up on the chat backend, ping Bob or Charlie — they have full context on the message dedup work.",
]

const CODE_SAMPLES: Array<{ lang: string; code: string }> = [
  {
    lang: 'typescript',
    code: `export async function fetchMessages(
  roomId: RoomId,
  cursor?: Cursor,
  limit = 50,
): Promise<Page<ChatMessage>> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', String(limit))
  const res = await fetch(\`/api/rooms/\${roomId}/messages?\${params}\`)
  if (!res.ok) throw makeChatError('NETWORK', res.statusText, true)
  return res.json()
}`,
  },
  {
    lang: 'typescript',
    code: `interface Reconciler {
  pending: Map<ClientMsgId, ChatMessage>
  confirmed: Map<MessageId, ChatMessage>
}

function reconcile(state: Reconciler, ev: ChatRealtimeEvent): Reconciler {
  if (ev.type !== 'MESSAGE_CREATED') return state
  const { clientMsgId, id } = ev.message
  if (state.pending.has(clientMsgId)) {
    const next = new Map(state.pending)
    next.delete(clientMsgId)
    return {
      pending: next,
      confirmed: new Map(state.confirmed).set(id, ev.message),
    }
  }
  return {
    ...state,
    confirmed: new Map(state.confirmed).set(id, ev.message),
  }
}`,
  },
  {
    lang: 'bash',
    code: `# Reproduce the virtualization perf issue locally
pnpm --filter chat-frontend dev

# In devtools console:
__chatMocks.loadHeavyDataset()

# Navigate to /c/heavy and record a performance trace
# Target: long tasks < 5% of scroll duration`,
  },
  {
    lang: 'python',
    code: `def diff_heights(records):
    """Return a histogram of measured row heights, bucketed by 16px."""
    buckets = {}
    for r in records:
        key = (r.height // 16) * 16
        buckets[key] = buckets.get(key, 0) + 1
    return sorted(buckets.items())


for bucket, count in diff_heights(rows):
    print(f"{bucket:4d}px  {'#' * count}")`,
  },
  {
    lang: 'sql',
    code: `WITH recent AS (
  SELECT id, room_id, author_id, server_created_at
  FROM chat_messages
  WHERE server_created_at >= NOW() - INTERVAL '7 days'
)
SELECT room_id,
       COUNT(*) AS msg_count,
       COUNT(DISTINCT author_id) AS unique_authors
FROM recent
GROUP BY room_id
ORDER BY msg_count DESC
LIMIT 20;`,
  },
]

const LONG_PARAGRAPH_SEEDS = [
  'Here is the full context for the incident we just finished investigating.',
  'The root cause turned out to be in the cursor encoding path.',
  'When a message arrived simultaneously via realtime and via a pending listMessages call, the cursor decoder would hand back a ts that preceded the realtime-delivered message by exactly one millisecond.',
  'This caused the optimistic reconcile layer to keep both copies instead of deduping, since our key was (id, server_ts) and the server_ts values differed at the millisecond level.',
  'The fix has three parts: 1) truncate server_ts to second precision at the cursor boundary, 2) key dedup only on id, 3) add a regression fixture with two messages at the exact same second.',
  'Long-term we should move to a server-assigned monotonic sequence number — this would let us drop the millisecond-level timestamp comparisons entirely. Tracking that as a follow-up ticket.',
  'Action items captured in DASH-412 through DASH-417. I will circulate the postmortem doc tomorrow once the template is finalized.',
  'Thanks to everyone who helped debug this in real-time last night, especially Alice for the clutch tcpdump capture that pinned down the race window.',
  "If anyone has questions about the reasoning behind any of the fixes, grab me async — I'm happy to walk through it in detail. There's a lot more nuance in the dedup path than the one-line fix suggests.",
  'Filing this under lessons learned: our cursor format is leaky in a way that makes debugging hard. v2 should use an opaque token with server-side semantics.',
  "One more thing — the UI team noticed that during the incident, the 'connection reestablished' banner kept flickering. Fixing that separately in DASH-418.",
  'Reminder for tomorrow: all-hands at 11am, demo slot is 15 minutes, please have your browser pre-loaded with the staging URL to avoid cold-start delays.',
  'That is everything on my end for now. Going to grab coffee and then circle back to the membership invalidation work that got deprioritized during this incident.',
  "Oh, almost forgot: if you see any lingering 'UNKNOWN' errors in Sentry from last night, those are expected noise — the error boundary was catching the pre-fix state. Already filtered them out of the dashboard.",
  'Alright, logging off for real this time. Ping me on-call if anything explodes.',
]

const LINK_PARAGRAPH_SETS: Array<Array<{ text: string; url: string }>> = [
  [
    { text: 'runbook', url: 'https://internal.example.com/runbooks/chat' },
    { text: 'dashboard', url: 'https://grafana.example.com/d/chat/chat-overview' },
    { text: 'postmortem template', url: 'https://internal.example.com/docs/postmortem-template' },
  ],
  [
    { text: 'Lexical docs', url: 'https://lexical.dev/docs/intro' },
    { text: 'TanStack Virtual', url: 'https://tanstack.com/virtual/latest' },
    { text: 'Virtuoso Message List', url: 'https://virtuoso.dev/message-list/' },
  ],
  [
    { text: 'WCAG 2.2 AA', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
    { text: 'axe-core', url: 'https://github.com/dequelabs/axe-core' },
    { text: 'React 19 blog', url: 'https://react.dev/blog/2024/12/05/react-19' },
  ],
]

// ─── Lexical node factories for heavy-specific shapes ─────────────────────────

/** A paragraph with multiple inline link children mixed with plain text runs. */
function multiLinkParagraph(
  intro: string,
  links: Array<{ text: string; url: string }>,
  outro: string,
): SerializedEditorState {
  const children: unknown[] = [
    { detail: 0, format: 0, mode: 'normal', style: '', text: intro, type: 'text', version: 1 },
  ]
  links.forEach((l, i) => {
    children.push({
      children: [
        { detail: 0, format: 0, mode: 'normal', style: '', text: l.text, type: 'text', version: 1 },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      rel: 'noopener',
      target: '_blank',
      title: null,
      type: 'link',
      url: l.url,
      version: 1,
    })
    const sep = i < links.length - 1 ? ', ' : ' '
    children.push({
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text: sep,
      type: 'text',
      version: 1,
    })
  })
  children.push({
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: outro,
    type: 'text',
    version: 1,
  })
  return {
    root: {
      children: [
        {
          children,
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as SerializedEditorState
}

/** Multi-paragraph body — each seed becomes its own <p>. */
function multiParagraph(seeds: string[]): SerializedEditorState {
  return {
    root: {
      children: seeds.map((text) => ({
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as SerializedEditorState
}

// ─── Factory ──────────────────────────────────────────────────────────────────

interface HeavyRow {
  kind: 'short' | 'medium' | 'code' | 'link' | 'long'
  index: number
}

function buildPlan(): HeavyRow[] {
  const plan: HeavyRow[] = []
  for (let i = 0; i < 800; i++) plan.push({ kind: 'short', index: i })
  for (let i = 0; i < 100; i++) plan.push({ kind: 'medium', index: i })
  for (let i = 0; i < 50; i++) plan.push({ kind: 'code', index: i })
  for (let i = 0; i < 30; i++) plan.push({ kind: 'link', index: i })
  for (let i = 0; i < 20; i++) plan.push({ kind: 'long', index: i })
  // deterministic shuffle for interleaved variety
  const rng = mulberry32(0x515ea5)
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[plan[i], plan[j]] = [plan[j], plan[i]]
  }
  return plan
}

/**
 * Generate 1,000 heavy mock messages, spread across ~3 days so DateDividers
 * fire. Roughly 10% of messages have `threadParentId` set — channel view
 * filters those out.
 */
export function generateHeavyMessages(roomId: string = HEAVY_ROOM_ID): ChatMessage[] {
  const plan = buildPlan()
  const rng = mulberry32(0xc4a7)
  const total = plan.length
  const startMs = Date.UTC(2025, 0, 11, 9, 0, 0)
  // spread ~3 days (259,200 s) across N messages → ~260 ms interval on average
  const rangeMs = 3 * 24 * 60 * 60 * 1000
  const step = rangeMs / total

  // Pick a fake parent id up front (does not need to exist — channel view
  // filters `threadParentId !== null` out regardless of parent existence)
  const parentIds = ['msg-heavy-000050', 'msg-heavy-000123', 'msg-heavy-000400']

  const messages: ChatMessage[] = []
  for (let i = 0; i < total; i++) {
    const row = plan[i]
    const tsMs = startMs + Math.floor(i * step + rng() * step * 0.4)
    const iso = new Date(tsMs).toISOString()
    const authorId = MOCK_MEMBERS[i % MOCK_MEMBERS.length].id
    const id = `msg-heavy-${String(i).padStart(6, '0')}`

    let content: SerializedEditorState
    let plainText: string
    switch (row.kind) {
      case 'short': {
        const pool = SHORT_LINES
        const pick = pool[Math.floor(rng() * pool.length)]
        // Occasionally make it bold for variety (still "short")
        if (rng() < 0.15) {
          content = boldText(pick)
        } else {
          content = simpleText(pick)
        }
        plainText = pick
        break
      }
      case 'medium': {
        const pick = MEDIUM_PARAGRAPHS[row.index % MEDIUM_PARAGRAPHS.length]
        content = simpleText(pick)
        plainText = pick
        break
      }
      case 'code': {
        const sample = CODE_SAMPLES[row.index % CODE_SAMPLES.length]
        content = codeBlock(sample.lang, sample.code)
        plainText = sample.code
        break
      }
      case 'link': {
        const set = LINK_PARAGRAPH_SETS[row.index % LINK_PARAGRAPH_SETS.length]
        const intro = 'Some helpful links: '
        const outro = ' — ping me if anything is broken.'
        content = multiLinkParagraph(intro, set, outro)
        plainText = intro + set.map((s) => s.text).join(', ') + outro
        // Fall back to the plain text variant if link factory produces malformed
        // JSON in edge cases (keeps hot path safe).
        if (!content) content = linkText(set[0].text, set[0].url)
        break
      }
      case 'long': {
        const seedCount = 8 + Math.floor(rng() * 8) // 8–15 paragraphs
        const seeds = LONG_PARAGRAPH_SEEDS.slice(0, seedCount)
        content = multiParagraph(seeds)
        plainText = seeds.join('\n\n')
        break
      }
    }

    // Thread reply 10% of the time (filtered out of channel view)
    const isThreadReply = rng() < 0.1
    const threadParentId = isThreadReply
      ? parentIds[Math.floor(rng() * parentIds.length)]
      : null

    messages.push({
      id,
      roomId,
      authorId,
      content,
      plainText,
      clientCreatedAt: iso,
      serverCreatedAt: iso,
      editedAt: null,
      deletedAt: null,
      threadParentId,
      replyCount: 0,
      clientMsgId: `cmid-heavy-${id}`,
      contentVersion: 1,
      version: 1,
    })
  }

  // Sort chronologically ascending so consumer invariants hold
  messages.sort(
    (a, b) =>
      new Date(a.serverCreatedAt).getTime() - new Date(b.serverCreatedAt).getTime(),
  )
  return messages
}
