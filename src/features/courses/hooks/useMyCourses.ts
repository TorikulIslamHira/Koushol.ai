import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CourseRow } from '@/types/database'

/** Fetches the signed-in teacher's own courses (draft + published) for the "/teach" dashboard. Admins see every course they own too, but not other teachers' — platform-wide visibility is Phase 5. */
export function useMyCourses() {
  const { session } = useAuth()
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(
        ({ data, error }) => {
          if (error) setError(error.message)
          setCourses((data as CourseRow[]) ?? [])
          setLoading(false)
        },
        (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load your courses.')
          setLoading(false)
        },
      )
  }, [session])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { courses, loading, error, refetch }
}
