import { File as FileIcon, FileImage } from 'lucide-react'
import type { MessageAttachment } from '@/types/chat'
import { cn } from '@/shared/lib/cn'

interface Props {
  attachments: MessageAttachment[]
  className?: string
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${SIZE_UNITS[unit]}`
}

export function MessageAttachments({ attachments, className }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className={cn('mt-2 flex flex-wrap gap-2', className)}>
      {attachments.map((att) => {
        const isImage = att.mimeType.startsWith('image/') && Boolean(att.url)
        if (isImage) {
          return (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-md border border-border transition hover:opacity-90"
              title={`${att.name} • ${formatSize(att.size)}`}
            >
              <img
                src={att.url}
                alt={att.name}
                className="max-h-72 max-w-sm object-contain"
                loading="lazy"
              />
            </a>
          )
        }

        const Icon = att.mimeType.startsWith('image/') ? FileImage : FileIcon
        const card = (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate font-medium">{att.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatSize(att.size)}
                {att.mimeType ? ` · ${att.mimeType}` : ''}
              </div>
            </div>
          </div>
        )

        return att.url ? (
          <a
            key={att.id}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            download={att.name}
            className="block max-w-sm transition hover:bg-muted/60"
          >
            {card}
          </a>
        ) : (
          <div key={att.id} className="max-w-sm">
            {card}
          </div>
        )
      })}
    </div>
  )
}
