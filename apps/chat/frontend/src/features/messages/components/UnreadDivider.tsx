interface Props {
  count?: number
}

export function UnreadDivider({ count }: Props) {
  return (
    <div className="my-2 flex items-center gap-3" role="separator" aria-label="New messages">
      <div className="flex-1 border-t border-destructive/60" />
      <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
        {count ? `${count} new messages` : 'New messages'}
      </span>
      <div className="flex-1 border-t border-destructive/60" />
    </div>
  )
}
