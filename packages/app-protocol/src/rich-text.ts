import { z } from 'zod'

export const RICH_TEXT_MENTION_TYPES = ['PERSON', 'FILE'] as const

export const RichTextMentionTypeSchema = z.enum(RICH_TEXT_MENTION_TYPES)
export type RichTextMentionType = z.infer<typeof RichTextMentionTypeSchema>

export function normalizeRichTextMentionType(value: string | null | undefined): RichTextMentionType {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'PERSON' || normalized === 'MEMBER' || normalized === 'USER') {
    return 'PERSON'
  }
  return 'FILE'
}

export const RichTextPersonMentionSchema = z.object({
  appId: z.string().min(1),
  type: z.literal('PERSON'),
  memberId: z.string().min(1),
})

export const RichTextFileMentionSchema = z.object({
  appId: z.string().min(1),
  type: z.literal('FILE'),
  fileId: z.string().min(1),
})

export const RichTextMentionSchema = z.discriminatedUnion('type', [
  RichTextPersonMentionSchema,
  RichTextFileMentionSchema,
])
export type RichTextMention = z.infer<typeof RichTextMentionSchema>

export function getRichTextMentionId(mention: RichTextMention): string {
  return mention.type === 'PERSON' ? mention.memberId : mention.fileId
}

export function getRichTextMentionKey(mention: RichTextMention): string {
  return `${mention.appId}:${mention.type}:${getRichTextMentionId(mention)}`
}

export const RichTextPayloadSchema = z.object({
  content: z.unknown(),
  plainText: z.string(),
  mentions: z.array(RichTextMentionSchema),
})
export type RichTextPayload<TContent = unknown> = Omit<
  z.infer<typeof RichTextPayloadSchema>,
  'content'
> & {
  content: TContent
}
