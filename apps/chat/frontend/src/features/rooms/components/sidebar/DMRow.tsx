import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import type { ChatRoom } from '@/types/chat'

export function DMRow({ room }: { room: ChatRoom }) {
  const initials = room.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <NavLink
      to={`/chat/${room.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-surface-hi text-t1' : 'text-t2 hover:bg-surface hover:text-t1',
        )
      }
    >
      <Avatar size="sm" className="h-5 w-5">
        <AvatarImage src={undefined} alt={room.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate text-left">{room.name}</span>
      {room.unreadCount > 0 && (
        <span className="rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
          {room.unreadCount}
        </span>
      )}
    </NavLink>
  )
}
