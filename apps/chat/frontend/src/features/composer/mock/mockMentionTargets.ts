import type { MentionQuery, MentionTarget } from '@dashway/chat-ui'
import { MOCK_MEMBERS } from '@/data/mockData'

const PEOPLE_TARGETS: MentionTarget[] = MOCK_MEMBERS.map((member) => ({
  type: 'person',
  id: member.id,
  label: member.name,
  description: `${member.name} from the current workspace`,
  source: 'People',
}))

const MOCK_TARGETS: MentionTarget[] = [
  ...PEOPLE_TARGETS,
  {
    type: 'document',
    id: 'doc-chat-fe-handoff',
    label: 'Chat frontend BE handoff',
    description: 'REST, STOMP, Lexical content and optimistic send contract',
    source: 'Docs',
  },
  {
    type: 'document',
    id: 'doc-universal-mention',
    label: 'Universal mention design',
    description: 'Notion-style mention picker for people, docs and issues',
    source: 'Docs',
  },
  {
    type: 'document',
    id: 'doc-lexical-composer',
    label: 'Lexical composer ADR',
    description: 'Why Slack-style composer stays on Lexical',
    source: 'Docs',
  },
  {
    type: 'issue',
    id: 'DW-142',
    label: 'DW-142 Universal mention picker',
    description: 'Design mock mention search and inline chips',
    source: 'Issues',
  },
  {
    type: 'issue',
    id: 'DW-118',
    label: 'DW-118 Attachment tray',
    description: 'Mock file upload preview for chat composer',
    source: 'Issues',
  },
  {
    type: 'issue',
    id: 'DW-097',
    label: 'DW-097 Context search bridge',
    description: 'Use context-api search results as mention targets',
    source: 'Issues',
  },
  {
    type: 'team',
    id: 'team-platform',
    label: 'Platform Team',
    description: 'Backend, graph and desktop shell ownership',
    source: 'Teams',
  },
  {
    type: 'app',
    id: 'app-context-api',
    label: 'Context API',
    description: 'GraphQL search and permission-filtered app content',
    source: 'Apps',
  },
]

const RECENT_TARGET_IDS = new Set([
  'alice',
  'doc-universal-mention',
  'DW-142',
  'app-context-api',
  'team-platform',
])

export async function searchMockMentionTargets({
  query,
  limit,
}: MentionQuery): Promise<MentionTarget[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 80))

  const normalizedQuery = query.trim().toLowerCase()
  const candidates =
    normalizedQuery.length === 0
      ? MOCK_TARGETS.filter((target) => RECENT_TARGET_IDS.has(target.id))
      : MOCK_TARGETS

  return candidates
    .map((target) => ({
      target,
      score: scoreTarget(target, normalizedQuery),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label))
    .slice(0, limit)
    .map(({ target }) => target)
}

function scoreTarget(target: MentionTarget, query: string): number {
  if (query.length === 0) return RECENT_TARGET_IDS.has(target.id) ? 10 : 0

  const haystack = [
    target.id,
    target.label,
    target.description ?? '',
    target.source ?? '',
    target.type,
  ]
    .join(' ')
    .toLowerCase()

  if (target.id.toLowerCase() === query) return 100
  if (target.label.toLowerCase().startsWith(query)) return 80
  if (target.id.toLowerCase().startsWith(query)) return 70
  if (haystack.includes(query)) return 40
  return 0
}
