import { z } from 'zod'

export const RichTextResourceTypeSchema = z.string().min(1)
export type RichTextResourceType = z.infer<typeof RichTextResourceTypeSchema>

export const RichTextMentionTypeSchema = RichTextResourceTypeSchema
export type RichTextMentionType = RichTextResourceType

export const RichTextMentionSchema = z.object({
  appId: z.string().min(1),
  resourceType: RichTextResourceTypeSchema,
  resourceId: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
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
