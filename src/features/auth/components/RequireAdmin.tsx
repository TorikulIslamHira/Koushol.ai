import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Route guard for the "/admin" pages — admin role only (unlike RequireTeacher, which also
 * allows admins into teacher pages, admins are the only role allowed here). UX convenience
 * only — the real enforcement is Supabase RLS (see supabase/migrations/), so a blocked
 * request is still blocked even if bypassed.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }

  if (profile && profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
