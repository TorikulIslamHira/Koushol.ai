import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterRow, CourseRow } from '@/types/database'

/** Fetches one course plus its chapters (ordered) for the course detail / reader pages. Chapter visibility beyond the free-preview chapter is enforced by RLS, not here. */
export function useCourse(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseRow | null>(null)
  const [chapters, setChapters] = useState<ChapterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!courseId) return
    setLoading(true)
    Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('chapters').select('*').eq('course_id', courseId).order('order_index'),
    ])
      .then(([courseRes, chaptersRes]) => {
        if (courseRes.error) setError(courseRes.error.message)
        setCourse((courseRes.data as CourseRow) ?? null)
        setChapters((chaptersRes.data as ChapterRow[]) ?? [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load course.')
        setLoading(false)
      })
  }, [courseId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { course, chapters, loading, error, refetch }
}
