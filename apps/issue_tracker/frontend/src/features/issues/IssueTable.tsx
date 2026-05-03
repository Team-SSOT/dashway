import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvatarStack } from '@/components/kibo-ui/avatar-stack'
import { PriorityBadge } from '@/components/kibo-ui/priority'
import { StatusBadge } from '@/components/kibo-ui/status'
import { DataTable } from '@/components/kibo-ui/table'
import { TagList } from '@/components/kibo-ui/tags'
import { mockIssues } from './mockData'
import type { Issue } from './types'

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const COLUMNS: ColumnDef<Issue>[] = [
  {
    id: 'key',
    accessorKey: 'key',
    header: 'Key',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-t2">{String(getValue())}</span>
    ),
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="flex min-w-[280px] flex-col gap-1">
        <span className="font-medium text-t1">{row.original.title}</span>
        {row.original.labels.length > 0 && <TagList labels={row.original.labels} max={4} />}
      </div>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
  },
  {
    id: 'assignees',
    header: 'Assignees',
    enableSorting: false,
    cell: ({ row }) => <AvatarStack users={row.original.assignees} size="sm" max={4} />,
  },
  {
    id: 'dueAt',
    accessorKey: 'dueAt',
    header: 'Due',
    cell: ({ row }) => <span className="text-t2">{formatDate(row.original.dueAt)}</span>,
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) => <span className="text-t3">{formatDate(row.original.updatedAt)}</span>,
  },
]

export const IssueTable = () => {
  const navigate = useNavigate()
  const data = useMemo(() => mockIssues, [])
  return <DataTable data={data} columns={COLUMNS} onRowClick={(r) => navigate(`/issues/${r.id}`)} />
}
