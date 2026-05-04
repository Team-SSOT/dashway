import { z } from 'zod'
import { SidebarBadgeSchema, SidebarSpecSchema } from './manifest'

export const ThemeModeSchema = z.enum(['system', 'light', 'dark'])
export type ThemeMode = z.infer<typeof ThemeModeSchema>

export const PROTOCOL_VERSION = 1

export const PatchOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('set-badge'),
    itemId: z.string(),
    badge: SidebarBadgeSchema.nullable(),
  }),
  z.object({
    op: z.literal('replace-group'),
    groupId: z.string(),
    items: SidebarSpecSchema.shape.groups.element.shape.items,
  }),
])
export type PatchOp = z.infer<typeof PatchOpSchema>

export const MessageToShellSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dashway:hello'),
    protocolVersion: z.literal(PROTOCOL_VERSION),
    appId: z.string(),
  }),
  z.object({
    type: z.literal('dashway:sidebar.replace'),
    appId: z.string(),
    sidebar: SidebarSpecSchema,
  }),
  z.object({
    type: z.literal('dashway:sidebar.patch'),
    appId: z.string(),
    ops: z.array(PatchOpSchema),
  }),
  z.object({
    type: z.literal('dashway:route.changed'),
    appId: z.string(),
    appRoute: z.string(),
  }),
  z.object({
    type: z.literal('dashway:session.invalid'),
    appId: z.string(),
  }),
])
export type MessageToShell = z.infer<typeof MessageToShellSchema>

export const MessageToAppSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dashway:hello.ack'),
    shellVersion: z.literal(PROTOCOL_VERSION),
  }),
  z.object({
    type: z.literal('dashway:route.navigate'),
    appRoute: z.string(),
  }),
  z.object({
    type: z.literal('dashway:theme.changed'),
    mode: ThemeModeSchema,
  }),
])
export type MessageToApp = z.infer<typeof MessageToAppSchema>
