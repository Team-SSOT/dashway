import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/features/issues/types'
import { cn } from '@/lib/utils'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const AvatarStack = ({
  users,
  max = 3,
  size = 'md',
  className,
}: {
  users: User[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
}) => {
  if (users.length === 0) {
    return <span className="text-xs text-t3">Unassigned</span>
  }
  const visible = users.slice(0, max)
  const overflow = users.length - visible.length
  const sizeClass = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[10px]'

  return (
    <div className={cn('flex -space-x-1.5', className)}>
      {visible.map((user) => (
        <Avatar key={user.id} className={cn(sizeClass, 'ring-2 ring-bg-1')}>
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-bg-3 text-t2">{initials(user.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-bg-3 ring-2 ring-bg-1 font-medium text-t2',
            sizeClass,
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
