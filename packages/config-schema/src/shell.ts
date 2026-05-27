import { z } from 'zod'
import { WorkspaceConfigSchema } from './workspace-config'
import { WorkspaceMetaSchema } from './workspace-meta'

export const ThemeModeSchema = z.enum(['system', 'light', 'dark'])
export type ThemeMode = z.infer<typeof ThemeModeSchema>

export const ShellMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  authorities: z.array(z.string()),
  isEnabled: z.boolean(),
})

export type ShellMember = z.infer<typeof ShellMemberSchema>

export const ShellLoginInputSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
})

export type ShellLoginInput = z.infer<typeof ShellLoginInputSchema>

export const ShellSignupInputSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type ShellSignupInput = z.infer<typeof ShellSignupInputSchema>

const GraphqlPathSegmentSchema = z.union([z.string(), z.number()])

export const ShellGraphqlRequestSchema = z.object({
  query: z.string(),
  variables: z.record(z.unknown()).optional(),
  operationName: z.string().optional(),
})

export type ShellGraphqlRequest = z.infer<typeof ShellGraphqlRequestSchema>

export const ShellGraphqlErrorSchema = z.object({
  message: z.string(),
  path: z.array(GraphqlPathSegmentSchema).optional(),
  extensions: z.record(z.unknown()).optional(),
})

export type ShellGraphqlError = z.infer<typeof ShellGraphqlErrorSchema>

export const ShellGraphqlResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(ShellGraphqlErrorSchema).optional(),
})

export type ShellGraphqlResponse = z.infer<typeof ShellGraphqlResponseSchema>

export const ShellBootstrapUnauthenticatedSchema = z.object({
  status: z.literal('unauthenticated'),
  initialTheme: ThemeModeSchema,
})

export type ShellBootstrapUnauthenticatedResult = z.infer<typeof ShellBootstrapUnauthenticatedSchema>

export const ShellBootstrapReadySchema = z.object({
  status: z.literal('ready'),
  initialTheme: ThemeModeSchema,
  member: ShellMemberSchema,
  workspaces: z.array(WorkspaceMetaSchema),
  activeWorkspaceId: z.string().nullable(),
  workspaceConfig: WorkspaceConfigSchema,
})

export type ShellBootstrapReadyResult = z.infer<typeof ShellBootstrapReadySchema>

export const ShellBootstrapResultSchema = z.discriminatedUnion('status', [
  ShellBootstrapUnauthenticatedSchema,
  ShellBootstrapReadySchema,
])

export type ShellBootstrapResult = z.infer<typeof ShellBootstrapResultSchema>
