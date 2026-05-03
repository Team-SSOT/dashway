import { useCallback, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { Kanban, type KanbanColumnDef } from '@/components/kibo-ui/kanban'
import { IssueCard } from './IssueCard'
import { mockIssues } from './mockData'
import { type Issue, type IssueStatus, STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from './types'

const COLUMNS: readonly KanbanColumnDef<IssueStatus>[] = STATUS_ORDER.filter(
  (s) => s !== 'CANCELLED',
).map((status) => ({
  id: status,
  title: STATUS_LABEL[status],
  accent: STATUS_COLOR[status],
}))

interface BoardItem extends Issue {
  columnId: IssueStatus
}

const toBoardItems = (issues: Issue[]): BoardItem[] =>
  issues.filter((i) => i.status !== 'CANCELLED').map((i) => ({ ...i, columnId: i.status }))

export const IssueBoard = () => {
  const [issues, setIssues] = useState<Issue[]>(mockIssues)
  const [, startTransition] = useTransition()
  const navigate = useNavigate()

  const items = toBoardItems(issues)

  const handleMove = useCallback((id: string, toStatus: IssueStatus) => {
    startTransition(() => {
      setIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, status: toStatus } : issue)),
      )
    })
  }, [])

  const renderCard = useCallback(
    (item: BoardItem) => (
      <button
        type="button"
        onClick={() => navigate(`/issues/${item.id}`)}
        className="block w-full text-left"
      >
        <IssueCard issue={item} />
      </button>
    ),
    [navigate],
  )

  return (
    <Kanban<BoardItem, IssueStatus>
      columns={COLUMNS}
      items={items}
      renderCard={renderCard}
      onMove={handleMove}
    />
  )
}
