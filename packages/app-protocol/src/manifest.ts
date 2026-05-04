import { z } from 'zod'
import { IconNameSchema } from './icons'

export const ToneSchema = z.enum(['neutral', 'info', 'warn', 'err', 'ok'])
export type Tone = z.infer<typeof ToneSchema>

export const SidebarBadgeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('count'),
    value: z.number().int().nonnegative(),
    tone: ToneSchema.optional(),
  }),
  z.object({
    kind: z.literal('dot'),
    tone: ToneSchema.optional(),
  }),
])
export type SidebarBadge = z.infer<typeof SidebarBadgeSchema>

export const SidebarItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: IconNameSchema,
  appRoute: z.string().min(1),
  badge: SidebarBadgeSchema.optional(),
})
export type SidebarItem = z.infer<typeof SidebarItemSchema>

export const SidebarGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  collapsible: z.boolean().default(true),
  defaultCollapsed: z.boolean().default(false),
  items: z.array(SidebarItemSchema),
})
export type SidebarGroup = z.infer<typeof SidebarGroupSchema>

export const SidebarPrimaryActionSchema = z.object({
  label: z.string().min(1),
  appRoute: z.string().min(1),
  icon: IconNameSchema.optional(),
})
export type SidebarPrimaryAction = z.infer<typeof SidebarPrimaryActionSchema>

export const SidebarSpecSchema = z.object({
  primaryAction: SidebarPrimaryActionSchema.optional(),
  groups: z.array(SidebarGroupSchema),
})
export type SidebarSpec = z.infer<typeof SidebarSpecSchema>

export const DashwayAppManifestSchema = z.object({
  protocolVersion: z.literal(1),
  app: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    icon: IconNameSchema,
  }),
  sidebar: SidebarSpecSchema,
})
export type DashwayAppManifest = z.infer<typeof DashwayAppManifestSchema>

export const MANIFEST_PATH = '/.well-known/dashway-app.json'
