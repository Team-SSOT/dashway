import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useChannels } from '@/features/rooms/hooks/useChannels'
import { ChannelRow } from './ChannelRow'

export function ChannelsSection() {
  const [open, setOpen] = useState(true)
  const { data: channels = [] } = useChannels()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex w-full items-center gap-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-t3 hover:text-t2"
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
        Channels
      </button>
      {open && (
        <div className="mb-3 flex flex-col gap-0.5">
          {channels.map((room) => (
            <ChannelRow key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  )
}
