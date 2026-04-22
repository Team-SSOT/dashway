import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { LoginPlaceholder } from '@/pages/LoginPlaceholder'
import { NotFound } from '@/pages/NotFound'
import { EmptyRoom } from '@/features/rooms/components/EmptyRoom'
import { RoomView } from '@/features/rooms/components/RoomView'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPlaceholder /> },
  {
    path: '/c',
    element: <AppShell />,
    children: [
      { index: true, element: <EmptyRoom /> },
      { path: ':roomId', element: <RoomView /> },
      { path: ':roomId/thread/:msgId', element: <RoomView /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
