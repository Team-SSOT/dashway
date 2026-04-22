import { MessageSquare } from 'lucide-react'

export function EmptyMessages() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">No messages yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Be the first to say something.</p>
      </div>
    </div>
  )
}
