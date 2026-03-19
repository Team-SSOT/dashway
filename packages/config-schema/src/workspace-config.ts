import { z } from 'zod'

export const WorkspaceConfigSchema = z.object({
  enabledApps: z.array(z.string()),
  navOrder: z.array(z.string()),
  defaultApp: z.string(),
  theme: z.enum(['system', 'light', 'dark']),
})

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>
