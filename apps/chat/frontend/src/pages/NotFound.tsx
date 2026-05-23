import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold">Not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}
