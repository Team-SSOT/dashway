import { useNavigate } from 'react-router-dom'
import { DEFAULT_CHAT_PATH } from '@/app/chatRoutes'
import { Button } from '@/shared/ui/button'

export function LoginPlaceholder() {
  const navigate = useNavigate()
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">dashway chat</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-2 text-muted-foreground">
          Real authentication ships in a later milestone. For now, continue as Demo User.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate(DEFAULT_CHAT_PATH)}>
          Continue as Demo User
        </Button>
      </div>
    </div>
  )
}
