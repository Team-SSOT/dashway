import { MessageSquare } from 'lucide-react'

export function EmptyRoom() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Select a channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a channel from the sidebar to start chatting.
        </p>
      </div>
    </div>
  )
}
