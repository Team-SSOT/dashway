import { z } from 'zod'

export const AppManifestSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  routes: z.array(z.string()),
  hasLocalSidebar: z.boolean(),
})

export type AppManifest = z.infer<typeof AppManifestSchema>
