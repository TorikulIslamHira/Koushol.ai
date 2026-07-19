import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseRow, CourseStatus } from '@/types/database'

/** Fetches courses for the admin review page, optionally filtered by status (e.g. 'pending_approval' for the review queue). RLS ("courses_select_owner_or_admin") restricts full visibility to admin callers — see supabase/migrations/20260719010100_create_courses.sql. */
export function useAdminCourses(statusFilter?: CourseStatus) {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    let query = supabase.from('courses').select('*').order('created_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    query.then(
      ({ data, error }) => {
        if (error) setError(error.message)
        setCourses((data as CourseRow[]) ?? [])
        setLoading(false)
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load courses.')
        setLoading(false)
      },
    )
  }, [statusFilter])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { courses, loading, error, refetch }
}
