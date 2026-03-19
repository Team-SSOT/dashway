import { z } from 'zod'

export const WorkspaceMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export type WorkspaceMeta = z.infer<typeof WorkspaceMetaSchema>
