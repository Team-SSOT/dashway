import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DEFAULT_CHAT_PATH } from './chatRoutes'
import { LoginPlaceholder } from '@/pages/LoginPlaceholder'
import { NotFound } from '@/pages/NotFound'
import { RoomView } from '@/features/rooms/components/RoomView'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPlaceholder /> },
  {
    path: '/c',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_CHAT_PATH} replace /> },
      { path: ':roomId', element: <RoomView /> },
      { path: ':roomId/thread/:msgId', element: <RoomView /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
