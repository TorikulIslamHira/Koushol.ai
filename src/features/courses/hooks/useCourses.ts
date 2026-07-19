import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseRow } from '@/types/database'

/** Fetches every published course for the browse/catalog page. RLS already restricts this to status='published' for anonymous/student callers. */
export function useCourses() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(
        ({ data, error }) => {
          if (cancelled) return
          if (error) setError(error.message)
          setCourses((data as CourseRow[]) ?? [])
          setLoading(false)
        },
        (err: unknown) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'Failed to load courses.')
          setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [])

  return { courses, loading, error }
}
