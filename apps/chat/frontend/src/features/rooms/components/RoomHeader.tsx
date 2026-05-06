import { Hash, Users, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import type { RoomType, ChatMember } from '@/types/chat'

interface Props {
  roomName: string
  roomType?: RoomType
  peerMember?: ChatMember
  topic?: string
  onMembersToggle?: () => void
  membersOpen?: boolean
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0] ?? '').join('').toUpperCase() || 'U'
}

export function RoomHeader({ roomName, roomType, peerMember, topic, onMembersToggle, membersOpen }: Props) {
  const icon = roomType === 'DM' ? (
    <Avatar size="sm" title={peerMember?.name}>
      {peerMember?.avatarUrl ? <AvatarImage src={peerMember.avatarUrl} alt={peerMember.name} /> : null}
      <AvatarFallback>{initials(peerMember?.name ?? roomName)}</AvatarFallback>
    </Avatar>
  ) : (
    <Hash className="h-5 w-5 text-muted-foreground" />
  )

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border px-4">
      {icon}
      <h1 className="text-base font-semibold">{roomName}</h1>
      {topic ? (
        <>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <p className="truncate text-sm text-muted-foreground">{topic}</p>
        </>
      ) : null}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Members"
          aria-expanded={membersOpen}
          onClick={onMembersToggle}
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
