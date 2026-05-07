import { isShellMode } from '@dashway/app-sdk'
import { createBrowserRouter, createMemoryRouter, Navigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DEFAULT_CHAT_PATH } from './chatRoutes'
import { NotFound } from '@/pages/NotFound'
import { RoomView } from '@/features/rooms/components/RoomView'

const routes = [
  { path: '/', element: <Navigate to={DEFAULT_CHAT_PATH} replace /> },
  {
    path: '/chat',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_CHAT_PATH} replace /> },
      { path: ':roomId', element: <RoomView /> },
      { path: ':roomId/thread/:msgId', element: <RoomView /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]

export const router = isShellMode()
  ? createMemoryRouter(routes, { initialEntries: [DEFAULT_CHAT_PATH] })
  : createBrowserRouter(routes)
