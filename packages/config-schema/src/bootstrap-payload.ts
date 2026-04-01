import { z } from 'zod'
import { WorkspaceMetaSchema } from './workspace-meta'

export const BootstrapPayloadSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  initialTheme: z.enum(['system', 'light', 'dark']),
  workspaces: z.array(WorkspaceMetaSchema),
})

export type BootstrapPayload = z.infer<typeof BootstrapPayloadSchema>
