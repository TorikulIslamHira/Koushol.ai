import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Catch-all 404 page for any unmatched route. */
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <Compass className="h-12 w-12 text-slate-300" aria-hidden="true" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-bold text-brand-ink">Page not found</h1>
      <p className="max-w-sm text-slate-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  )
}
