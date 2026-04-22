import { NavLink } from 'react-router-dom'
import { Hash, Loader2, AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/cn'
import { useRooms } from '../hooks/useRooms'

export function ChannelSidebar() {
  const { data: rooms, isLoading, isError } = useRooms()

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Workspace</p>
        <h2 className="mt-0.5 text-lg font-semibold">dashway</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="p-2" aria-label="Channels">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading channels…
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed to load channels
            </div>
          ) : !rooms || rooms.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">No channels yet.</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {rooms.map((room) => (
                <li key={room.id}>
                  <NavLink
                    to={`/c/${room.id}`}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-accent font-semibold text-accent-foreground'
                          : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
                      )
                    }
                  >
                    <Hash className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{room.name}</span>
                    {room.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {room.unreadCount}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </ScrollArea>
    </div>
  )
}
