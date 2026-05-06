import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useDMs } from '@/features/rooms/hooks/useDMs'
import { DMRow } from './DMRow'

export function DMsSection() {
  const [open, setOpen] = useState(true)
  const { data: dms = [] } = useDMs()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex w-full items-center gap-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-t3 hover:text-t2"
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
        Direct Messages
      </button>
      {open && (
        <div className="mb-3 flex flex-col gap-0.5">
          {dms.map((room) => (
            <DMRow key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  )
}
