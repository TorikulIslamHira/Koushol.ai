import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CourseRow, EnrollmentRow } from '@/types/database'

export interface EnrollmentWithCourse extends EnrollmentRow {
  course: CourseRow
  chapterCount: number
}

/** Fetches the current student's enrollments joined with course info and total chapter count, for the dashboard's progress bars. */
export function useMyEnrollments() {
  const { session } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('student_id', session.user.id)
      .then(
        async ({ data }) => {
          const rows = (data as (EnrollmentRow & { course: CourseRow })[]) ?? []
          const withCounts = await Promise.all(
            rows.map(async (row) => {
              const { count } = await supabase
                .from('chapters')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', row.course_id)
              return { ...row, chapterCount: count ?? 0 }
            }),
          )
          if (!cancelled) {
            setEnrollments(withCounts)
            setLoading(false)
          }
        },
        () => {
          if (!cancelled) setLoading(false)
        },
      )

    return () => {
      cancelled = true
    }
  }, [session])

  return { enrollments, loading }
}
