import { Hash } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { ChatRoom } from '@/types/chat'

export function ChannelRow({ room }: { room: ChatRoom }) {
  return (
    <NavLink
      to={`/c/${room.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-surface-hi text-t1' : 'text-t2 hover:bg-surface hover:text-t1',
        )
      }
    >
      <Hash className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-left">{room.name}</span>
      {room.unreadCount > 0 && (
        <span className="rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
          {room.unreadCount}
        </span>
      )}
    </NavLink>
  )
}
