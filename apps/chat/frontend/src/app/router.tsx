import { isShellMode } from '@dashway/app-sdk'
import { createBrowserRouter, createMemoryRouter, Navigate, useParams } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DEFAULT_CHAT_PATH } from './chatRoutes'
import { NotFound } from '@/pages/NotFound'
import { RoomView } from '@/features/rooms/components/RoomView'
import { useRooms } from '@/features/rooms/hooks/useRooms'
import { useIsLive } from './featureFlags'

function ThreadRoute() {
  const isLive = useIsLive()
  const { roomId = '' } = useParams<{ roomId: string }>()
  if (isLive) return <Navigate to={`/chat/${roomId}`} replace />
  return <RoomView />
}

function DefaultRoomRedirect() {
  const { data: rooms, isLoading } = useRooms()
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No rooms yet — create one from the sidebar.
      </div>
    )
  }
  return <Navigate to={`/chat/${rooms[0].id}`} replace />
}

const routes = [
  { path: '/', element: <Navigate to={DEFAULT_CHAT_PATH} replace /> },
  {
    path: '/chat',
    element: <AppShell />,
    children: [
      { index: true, element: <DefaultRoomRedirect /> },
      { path: ':roomId', element: <RoomView /> },
      { path: ':roomId/thread/:msgId', element: <ThreadRoute /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]

export const router = isShellMode()
  ? createMemoryRouter(routes, { initialEntries: [DEFAULT_CHAT_PATH] })
  : createBrowserRouter(routes)
