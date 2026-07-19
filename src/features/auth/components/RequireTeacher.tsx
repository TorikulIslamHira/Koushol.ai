import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Route guard for the teacher-authoring pages (course/chapter/quiz CRUD). UX convenience
 * only — the real enforcement is the Supabase RLS owner/admin policies (see
 * supabase/migrations/), so a blocked request is still blocked even if bypassed.
 */
export function RequireTeacher({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/teach' }} />
  }

  if (profile && profile.role !== 'teacher' && profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
