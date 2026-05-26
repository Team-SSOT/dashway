import { z } from 'zod'

export const RichTextMentionTypeSchema = z.enum(['person', 'document', 'issue', 'team', 'app'])
export type RichTextMentionType = z.infer<typeof RichTextMentionTypeSchema>

export const RichTextMentionSchema = z.object({
  type: RichTextMentionTypeSchema,
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  iconUrl: z.string().optional(),
  url: z.string().optional(),
})
export type RichTextMention = z.infer<typeof RichTextMentionSchema>

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
