import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Route guard for pages that need a signed-in student. This is UX convenience only —
 * the real enforcement is the Supabase RLS policies (see supabase/migrations/), so a
 * blocked request is still blocked even if someone bypasses this component.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
