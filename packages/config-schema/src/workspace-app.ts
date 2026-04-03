import { z } from 'zod'

export const WorkspaceAppSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  entryUrl: z.string().url(),
})

export type WorkspaceApp = z.infer<typeof WorkspaceAppSchema>
