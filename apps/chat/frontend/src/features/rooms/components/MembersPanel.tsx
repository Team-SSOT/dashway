import { useRef, useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useRoomMemberships } from '../hooks/useRoomMemberships'
import { useRemoveMember } from '../hooks/useRemoveMember'
import { canManageMembers } from '../permissions'
import { AddMembersDialog } from './AddMembersDialog'
// TODO(M3): replace with useCurrentUser/useMembersByIds hook when BE lands; do not let this leak into prod paths
import { MOCK_MEMBERS, currentUserId } from '@/data/mockData'
import type { RoomId, RoomRole } from '@/types/chat'
import { useIsLive } from '@/app/featureFlags'

interface MembersPanelProps {
  roomId: RoomId
  onClose: () => void
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// viewmodel-only — BE enum is OWNER|MEMBER; ADMIN/GUEST are mock-only values
const ROLE_LABEL: Record<RoomRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',   // viewmodel-only — BE enum is OWNER|MEMBER
  MEMBER: 'Member',
  GUEST: 'Guest',   // viewmodel-only — BE enum is OWNER|MEMBER
}

const ROLE_CLASS: Record<RoomRole, string> = {
  OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', // viewmodel-only — BE enum is OWNER|MEMBER
  MEMBER: 'bg-muted text-muted-foreground',
  GUEST: 'bg-muted text-muted-foreground', // viewmodel-only — BE enum is OWNER|MEMBER
}

export function MembersPanel({ roomId, onClose }: MembersPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const { data: memberships, isLoading } = useRoomMemberships(roomId)
  const removeMember = useRemoveMember(roomId)

  const memberById = Object.fromEntries(MOCK_MEMBERS.map((m) => [m.id, m]))
  const currentMembership = (memberships ?? []).find((m) => m.memberId === currentUserId)
  const canManage = canManageMembers(currentMembership?.role)

  const isLive = useIsLive()
  const existingMemberIds = new Set((memberships ?? []).map((m) => m.memberId))

  return (
    <aside className="flex h-full flex-col border-l border-border bg-card">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <h2 className="text-sm font-semibold">
          Members {memberships ? `(${memberships.length})` : ''}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
          aria-label="Close members panel"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {canManage && !isLive && (
        <div className="shrink-0 border-b border-border px-3 py-2">
          <Button
            ref={addButtonRef}
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Members
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading…</span>
          </div>
        ) : !memberships || memberships.length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <span className="text-sm text-muted-foreground">No members yet</span>
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {memberships.map((ms) => {
              const member = memberById[ms.memberId]
              if (!member) return null
              const isSelf = ms.memberId === currentUserId
              const isOwner = ms.role === 'OWNER'
              const showRemove = canManage && !isSelf && !isOwner

              return (
                <li
                  key={ms.memberId}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm">{member.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_CLASS[ms.role]}`}
                  >
                    {ROLE_LABEL[ms.role]}
                  </span>
                  {showRemove && !isLive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      aria-label={`Remove ${member.name}`}
                      disabled={removeMember.isPending}
                      onClick={() => removeMember.mutate(ms.memberId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>

      <AddMembersDialog
        roomId={roomId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingMemberIds={existingMemberIds}
        triggerRef={addButtonRef}
      />
    </aside>
  )
}
