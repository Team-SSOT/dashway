import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
}

export const DataTable = <T,>({ data, columns, onRowClick }: DataTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-bg-1/95 backdrop-blur">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sort = header.column.getIsSorted()
                const canSort = header.column.getCanSort()
                return (
                  <th
                    key={header.id}
                    className="border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-t3"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={cn(
                          'inline-flex items-center gap-1.5',
                          canSort && 'cursor-pointer hover:text-t1',
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort &&
                          (sort === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sort === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          ))}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                'group transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface',
              )}
              style={{ contentVisibility: 'auto' }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border-b border-border px-3 py-2.5 align-middle text-t1"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
