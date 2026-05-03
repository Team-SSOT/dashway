export type IssueStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'

export type IssuePriority = 'NO_PRIORITY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface User {
  id: string
  name: string
  avatarUrl?: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Issue {
  id: string
  key: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  assignees: User[]
  labels: Label[]
  reporter: User
  dueAt?: string
  createdAt: string
  updatedAt: string
  projectKey: string
}

export const STATUS_ORDER: IssueStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
]

export const STATUS_LABEL: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
}

export const STATUS_COLOR: Record<IssueStatus, string> = {
  BACKLOG: 'var(--color-status-backlog)',
  TODO: 'var(--color-status-todo)',
  IN_PROGRESS: 'var(--color-status-in-progress)',
  IN_REVIEW: 'var(--color-status-in-review)',
  DONE: 'var(--color-status-done)',
  CANCELLED: 'var(--color-status-cancelled)',
}

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
  NO_PRIORITY: 'No priority',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const PRIORITY_COLOR: Record<IssuePriority, string> = {
  NO_PRIORITY: 'var(--color-priority-none)',
  LOW: 'var(--color-priority-low)',
  MEDIUM: 'var(--color-priority-medium)',
  HIGH: 'var(--color-priority-high)',
  URGENT: 'var(--color-priority-urgent)',
}
