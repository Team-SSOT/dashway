import { Hash, Users, MoreHorizontal } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'

interface Props {
  roomName: string
  topic?: string
}

export function RoomHeader({ roomName, topic }: Props) {
  return (
    <header className="flex h-12 items-center gap-2 border-b border-border px-4">
      <Hash className="h-5 w-5 text-muted-foreground" />
      <h1 className="text-base font-semibold">{roomName}</h1>
      {topic ? (
        <>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <p className="truncate text-sm text-muted-foreground">{topic}</p>
        </>
      ) : null}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Members">
          <Users className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
