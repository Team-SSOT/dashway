import { MessageSquare } from 'lucide-react'
import { useIsLive } from '@/app/featureFlags'

export function EmptyMessages() {
  const isLive = useIsLive()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      {isLive ? (
        <div>
          <h2 className="text-xl font-semibold">메시지 히스토리 로드 중</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            BE V1.1: 메시지 히스토리 조회는 미구현 상태입니다. 메시지를 보내면 실시간 에코는 정상
            도착합니다. 히스토리는 BE <code>chatMessages</code> 리졸버 배포 후 자동 활성화됩니다.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">No messages yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to say something.</p>
        </div>
      )}
    </div>
  )
}
