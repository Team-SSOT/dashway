import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
// TODO(M3): replace with useCurrentUser/useMembersByIds hook when BE lands; do not let this leak into prod paths
import { currentUserId, MOCK_MEMBERS } from '@/data/mockData'
import { useIsLive } from '@/app/featureFlags'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { ScrollArea } from '@/shared/ui/scroll-area'
import type { MemberId, RoomId, RoomMembership } from '@/types/chat'
import { useAddMembers } from '../hooks/useAddMembers'
import { roomMembershipsQueryKey, useRoomMemberships } from '../hooks/useRoomMemberships'
import { useSearchMembers } from '../hooks/useSearchMembers'
import { canManageMembers } from '../permissions'

interface AddMembersDialogProps {
  roomId: RoomId
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMemberIds: Set<MemberId>
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AddMembersDialog({
  roomId,
  open,
  onOpenChange,
  existingMemberIds,
  triggerRef,
}: AddMembersDialogProps) {
  const isLive = useIsLive()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<MemberId>>(new Set())
  const [notices, setNotices] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const { data: membershipsData } = useRoomMemberships(roomId)
  const { data: searchData } = useSearchMembers(debouncedQ, roomId)
  const addMembers = useAddMembers(roomId)

  const currentMembership = (membershipsData ?? []).find((m) => m.memberId === currentUserId)

  useEffect(() => {
    if (!open) {
      setQ('')
      setDebouncedQ('')
      setSelectedIds(new Set())
      setNotices([])
      return
    }
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  // Mid-dialog reconcile: drop selected chips that are now room members.
  // We read selectedIds via the ref to compute pruned notices synchronously
  // (outside the setSelectedIds updater) so both state updates fire in the same batch.
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds

  useEffect(() => {
    if (!membershipsData) return
    const currentIds = new Set(membershipsData.map((m) => m.memberId))
    const memberNames = Object.fromEntries(MOCK_MEMBERS.map((m) => [m.id, m.name]))
    const pruned = [...selectedIdsRef.current].filter((id) => currentIds.has(id))
    if (pruned.length === 0) return
    const newNotices = pruned.map((id) => `${memberNames[id] ?? id} was just added`)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of pruned) {
        next.delete(id)
      }
      return next
    })
    setNotices((n) => [...n, ...newNotices])
  }, [membershipsData])

  const currentMemberIds = new Set((membershipsData ?? []).map((m) => m.memberId))
  const results = (searchData?.items ?? []).filter(
    (m) => !existingMemberIds.has(m.id) && !currentMemberIds.has(m.id),
  )

  function focusTriggerAfterClose() {
    setTimeout(() => triggerRef?.current?.focus(), 0)
  }

  function toggleSelect(id: MemberId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    const latest = qc.getQueryData<RoomMembership[]>(roomMembershipsQueryKey(roomId))
    const latestIds = new Set((latest ?? []).map((m) => m.memberId))
    const filteredIds = [...selectedIds].filter((id) => !latestIds.has(id))
    if (filteredIds.length === 0) return
    addMembers.mutate(filteredIds, {
      onSuccess: () => {
        onOpenChange(false)
        focusTriggerAfterClose()
      },
    })
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) focusTriggerAfterClose()
  }

  if (isLive) return null

  if (!canManageMembers(currentMembership?.role)) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to add members.
          </p>
        </DialogContent>
      </Dialog>
    )
  }

  const selectedMembers = MOCK_MEMBERS.filter((m) => selectedIds.has(m.id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>

        {notices.length > 0 && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {notices.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        )}

        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedMembers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {m.name}
                <button
                  type="button"
                  onClick={() => toggleSelect(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="ml-0.5 rounded-full hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-autocomplete="list"
          aria-label="Search members"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {debouncedQ.length > 0 && results.length > 0 && (
          <ScrollArea className="max-h-52">
            <div role="listbox" className="space-y-0.5">
              {results.map((member) => {
                const isSelected = selectedIds.has(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleSelect(member.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left">{member.name}</span>
                    {isSelected && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Selected
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {debouncedQ.length > 0 && results.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">No members found</p>
        )}

        {addMembers.isError && (
          <p role="alert" className="text-sm text-destructive">
            {(addMembers.error as { message?: string } | null)?.message ?? 'Failed to add members'}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.size === 0 || addMembers.isPending}>
            Add {selectedIds.size} member{selectedIds.size === 1 ? '' : 's'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
