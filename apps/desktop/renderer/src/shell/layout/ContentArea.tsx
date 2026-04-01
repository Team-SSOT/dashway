import { Outlet } from 'react-router-dom'

export function ContentArea() {
  return (
    <main className="content-area">
      <Outlet />
    </main>
  )
}
