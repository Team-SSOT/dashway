import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { cn } from '@/shared/lib/cn'

interface AvatarStackMember {
  id: string
  name: string
  avatarUrl?: string
}

interface Props {
  members: AvatarStackMember[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0] ?? '')
      .join('')
      .toUpperCase() || 'U'
  )
}

export function AvatarStack({ members, max = 3, size = 'sm', className }: Props) {
  const shown = members.slice(0, max)
  const overflow = Math.max(0, members.length - max)
  const dimensions = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'

  return (
    <div
      className={cn('flex -space-x-2', className)}
      aria-label={`${members.length} participants`}
    >
      {shown.map((m) => (
        <Avatar key={m.id} className={cn(dimensions, 'ring-2 ring-background')} title={m.name}>
          {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.name} /> : null}
          <AvatarFallback>{initials(m.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background',
            dimensions,
          )}
          aria-label={`${overflow} more participants`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  )
}
