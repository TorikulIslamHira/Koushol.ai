import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { EnrollmentRow } from '@/types/database'

/** Looks up (and can create) the current student's enrollment row for a course — the source of truth for unlocked_module_index. */
export function useEnrollment(courseId: string | undefined) {
  const { session } = useAuth()
  const [enrollment, setEnrollment] = useState<EnrollmentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!courseId || !session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (error) setError(error.message)
          setEnrollment((data as EnrollmentRow) ?? null)
          setLoading(false)
        },
        (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load enrollment.')
          setLoading(false)
        },
      )
  }, [courseId, session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const enroll = useCallback(async () => {
    if (!courseId || !session) return
    setEnrolling(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({ course_id: courseId, student_id: session.user.id })
        .select('*')
        .single()
      if (error) {
        setError(error.message)
        return
      }
      setEnrollment(data as EnrollmentRow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll.')
    } finally {
      setEnrolling(false)
    }
  }, [courseId, session])

  return { enrollment, loading, enrolling, error, enroll, refetch }
}
