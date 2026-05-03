import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

export interface KanbanColumnDef<TId extends string = string> {
  id: TId
  title: string
  accent?: string
}

export interface KanbanCardData {
  id: string
  columnId: string
}

interface KanbanProps<T extends KanbanCardData, TId extends string> {
  columns: readonly KanbanColumnDef<TId>[]
  items: readonly T[]
  renderCard: (item: T, isDragging: boolean) => ReactNode
  onMove: (id: string, toColumnId: TId) => void
  countLabel?: (column: KanbanColumnDef<TId>, count: number) => ReactNode
}

export const Kanban = <T extends KanbanCardData, TId extends string>({
  columns,
  items,
  renderCard,
  onMove,
  countLabel,
}: KanbanProps<T, TId>) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const target = over.id as TId
    if (columns.some((c) => c.id === target)) {
      onMove(String(active.id), target)
    }
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto p-4 scrollbar-thin">
        {columns.map((column) => {
          const colItems = items.filter((i) => i.columnId === column.id)
          return (
            <KanbanColumn key={column.id} column={column}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.accent ?? 'var(--color-t3)' }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide text-t1">
                    {column.title}
                  </span>
                  <span className="text-xs text-t3">
                    {countLabel ? countLabel(column, colItems.length) : colItems.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {colItems.map((item) => (
                  <KanbanCard key={item.id} id={item.id}>
                    {renderCard(item, false)}
                  </KanbanCard>
                ))}
              </div>
            </KanbanColumn>
          )
        })}
      </div>
      <DragOverlay>{activeItem ? renderCard(activeItem, true) : null}</DragOverlay>
    </DndContext>
  )
}

const KanbanColumn = ({ column, children }: { column: KanbanColumnDef; children: ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-[var(--radius-card)] border border-border bg-bg-1/40 p-3 transition-colors',
        isOver && 'border-border-hi bg-surface-hi',
      )}
    >
      {children}
    </div>
  )
}

const KanbanCard = ({ id, children }: { id: string; children: ReactNode }) => {
  const { setNodeRef, listeners, attributes, isDragging, transform } = useDraggable({ id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab touch-none rounded-md border border-border bg-bg-2/80 p-3 text-left transition-shadow hover:border-border-hi',
        isDragging && 'opacity-40',
      )}
    >
      {children}
    </div>
  )
}
