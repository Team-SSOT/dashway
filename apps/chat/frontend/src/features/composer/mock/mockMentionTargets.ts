import { getRichTextMentionId } from '@dashway/app-protocol'
import type { MentionQuery, MentionTarget } from '@dashway/chat-ui'
import type { DirectoryRepository } from '@/data/DirectoryRepository'
import { MockDirectoryRepository } from '@/data/MockDirectoryRepository'

const STATIC_TARGETS: MentionTarget[] = [
  {
    appId: 'docs',
    type: 'FILE',
    fileId: 'doc-chat-fe-handoff',
    label: 'Chat frontend BE handoff',
  },
  {
    appId: 'docs',
    type: 'FILE',
    fileId: 'doc-universal-mention',
    label: 'Universal mention design',
  },
  {
    appId: 'docs',
    type: 'FILE',
    fileId: 'doc-lexical-composer',
    label: 'Lexical composer ADR',
  },
]

const RECENT_TARGET_IDS = new Set([
  'alice',
  'doc-universal-mention',
  'doc-chat-fe-handoff',
])

export async function buildMentionTargets(
  directory: DirectoryRepository,
  query: MentionQuery,
): Promise<MentionTarget[]> {
  const normalizedQuery = query.query.trim().toLowerCase()

  const { items } = await directory.searchMembers({ q: normalizedQuery, limit: query.limit ?? 20 })
  const personTargets: MentionTarget[] = items.map((m) => ({
    appId: 'context-api',
    type: 'PERSON',
    memberId: m.id,
    label: m.name,
  }))

  if (normalizedQuery.length === 0) {
    const recentPersons = personTargets.filter((t) => RECENT_TARGET_IDS.has(getRichTextMentionId(t)))
    const recentStatic = STATIC_TARGETS.filter((t) => RECENT_TARGET_IDS.has(getRichTextMentionId(t)))
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
  const targetId = getRichTextMentionId(target)

  if (query.length === 0) return RECENT_TARGET_IDS.has(targetId) ? 10 : 0

  const haystack = [
    target.appId,
    target.type,
    targetId,
    target.label,
  ]
    .join(' ')
    .toLowerCase()

  if (targetId.toLowerCase() === query) return 100
  if (target.label.toLowerCase().startsWith(query)) return 80
  if (targetId.toLowerCase().startsWith(query)) return 70
  if (haystack.includes(query)) return 40
  return 0
}

let _mockDirectory: MockDirectoryRepository | undefined

export async function searchMockMentionTargets(query: MentionQuery): Promise<MentionTarget[]> {
  if (!_mockDirectory) _mockDirectory = new MockDirectoryRepository()
  return buildMentionTargets(_mockDirectory, query)
}
