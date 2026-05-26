import type { MentionQuery, MentionTarget } from '@dashway/chat-ui'
import type { DirectoryRepository } from '@/data/DirectoryRepository'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'

const STATIC_TARGETS: MentionTarget[] = [
  {
    appId: 'docs',
    resourceType: 'document',
    resourceId: 'doc-chat-fe-handoff',
    label: 'Chat frontend BE handoff',
    description: 'REST, STOMP, Lexical content and optimistic send contract',
  },
  {
    appId: 'docs',
    resourceType: 'document',
    resourceId: 'doc-universal-mention',
    label: 'Universal mention design',
    description: 'Notion-style mention picker for people, docs and issues',
  },
  {
    appId: 'docs',
    resourceType: 'document',
    resourceId: 'doc-lexical-composer',
    label: 'Lexical composer ADR',
    description: 'Why Slack-style composer stays on Lexical',
  },
  {
    appId: 'issue_tracker',
    resourceType: 'issue',
    resourceId: 'DW-142',
    label: 'DW-142 Universal mention picker',
    description: 'Design mock mention search and inline chips',
  },
  {
    appId: 'issue_tracker',
    resourceType: 'issue',
    resourceId: 'DW-118',
    label: 'DW-118 Attachment tray',
    description: 'Mock file upload preview for chat composer',
  },
  {
    appId: 'issue_tracker',
    resourceType: 'issue',
    resourceId: 'DW-097',
    label: 'DW-097 Context search bridge',
    description: 'Use context-api search results as mention targets',
  },
  {
    appId: 'context-api',
    resourceType: 'team',
    resourceId: 'team-platform',
    label: 'Platform Team',
    description: 'Backend, graph and desktop shell ownership',
  },
  {
    appId: 'context-api',
    resourceType: 'app',
    resourceId: 'app-context-api',
    label: 'Context API',
    description: 'GraphQL search and permission-filtered app content',
  },
]

const RECENT_TARGET_IDS = new Set([
  'alice',
  'doc-universal-mention',
  'DW-142',
  'app-context-api',
  'team-platform',
])

export async function buildMentionTargets(
  directory: DirectoryRepository,
  query: MentionQuery,
): Promise<MentionTarget[]> {
  const normalizedQuery = query.query.trim().toLowerCase()

  const { items } = await directory.searchMembers({ q: normalizedQuery, limit: query.limit ?? 20 })
  const personTargets: MentionTarget[] = items.map((m) => ({
    appId: 'context-api',
    resourceType: 'member',
    resourceId: m.id,
    label: m.name,
    description: `${m.name} from the current workspace`,
  }))

  if (normalizedQuery.length === 0) {
    const recentPersons = personTargets.filter((t) => RECENT_TARGET_IDS.has(t.resourceId))
    const recentStatic = STATIC_TARGETS.filter((t) => RECENT_TARGET_IDS.has(t.resourceId))
    return [...recentPersons, ...recentStatic]
  }

  const allCandidates = [...personTargets, ...STATIC_TARGETS]
  return allCandidates
    .map((target) => ({ target, score: scoreTarget(target, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label))
    .slice(0, query.limit ?? 20)
    .map(({ target }) => target)
}

function scoreTarget(target: MentionTarget, query: string): number {
  if (query.length === 0) return RECENT_TARGET_IDS.has(target.resourceId) ? 10 : 0

  const haystack = [
    target.appId,
    target.resourceType,
    target.resourceId,
    target.label,
    target.description ?? '',
  ]
    .join(' ')
    .toLowerCase()

  if (target.resourceId.toLowerCase() === query) return 100
  if (target.label.toLowerCase().startsWith(query)) return 80
  if (target.resourceId.toLowerCase().startsWith(query)) return 70
  if (haystack.includes(query)) return 40
  return 0
}

let _mockDirectory: MockDirectoryRepository | undefined

export async function searchMockMentionTargets(query: MentionQuery): Promise<MentionTarget[]> {
  if (!_mockDirectory) _mockDirectory = new MockDirectoryRepository()
  return buildMentionTargets(_mockDirectory, query)
}
