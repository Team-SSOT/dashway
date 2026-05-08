import { Star } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import type { ChatRoom } from '@/types/chat'
import { useToggleFavorite } from '@/features/rooms/hooks/useToggleFavorite'

export function DMRow({ room }: { room: ChatRoom }) {
  const toggle = useToggleFavorite()
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
          'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-surface-hi text-t1' : 'text-t2 hover:bg-surface hover:text-t1',
        )
      }
    >
      <Avatar size="sm" className="h-5 w-5">
        <AvatarImage src={undefined} alt={room.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate text-left">{room.name}</span>
      <button
        type="button"
        aria-label={room.isFavorite ? 'Unfavorite' : 'Favorite'}
        aria-pressed={room.isFavorite}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle.mutate({ roomId: room.id, next: !room.isFavorite })
        }}
        className={cn(
          'shrink-0 rounded p-0.5 transition-opacity',
          room.isFavorite
            ? 'opacity-100 text-amber-400'
            : 'opacity-0 group-hover:opacity-60 text-t3 hover:text-t1',
        )}
      >
        <Star className={cn('h-3.5 w-3.5', room.isFavorite && 'fill-current')} />
      </button>
      {room.unreadCount > 0 && (
        <span className="rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
          {room.unreadCount}
        </span>
      )}
    </NavLink>
  )
}
