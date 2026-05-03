import { z } from 'zod'

export const RegisteredAppManifestSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  routes: z.array(z.string()),
  hasLocalSidebar: z.boolean(),
})

export type RegisteredAppManifest = z.infer<typeof RegisteredAppManifestSchema>
