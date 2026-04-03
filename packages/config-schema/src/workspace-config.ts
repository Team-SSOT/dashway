import { z } from 'zod'
import { WorkspaceAppSchema } from './workspace-app'

export const WorkspaceConfigSchema = z.object({
  apps: z.array(WorkspaceAppSchema),
  enabledApps: z.array(z.string()),
  navOrder: z.array(z.string()),
  defaultApp: z.string().nullable(),
  theme: z.enum(['system', 'light', 'dark']),
})

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>
