import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PUBLIC_COURSE_COLUMNS } from '@/features/courses/hooks/useCourses'
import type { ChapterRow, CourseRow } from '@/types/database'

/**
 * Fetches one course plus its chapters (ordered) for the course detail / reader / teacher
 * editor pages. Chapter visibility beyond the free-preview chapter is enforced by RLS, not
 * here. Pass `includeRawNotes: true` only from teacher-authoring pages — raw_notes is the AI
 * generation input and shouldn't be fetched on student-facing pages (see useCourses.ts).
 */
export function useCourse(courseId: string | undefined, opts?: { includeRawNotes?: boolean }) {
  const [course, setCourse] = useState<CourseRow | null>(null)
  const [chapters, setChapters] = useState<ChapterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const includeRawNotes = opts?.includeRawNotes ?? false

  const refetch = useCallback(() => {
    if (!courseId) return
    setLoading(true)
    const courseQuery = includeRawNotes
      ? supabase.from('courses').select('*').eq('id', courseId).single()
      : supabase.from('courses').select(PUBLIC_COURSE_COLUMNS).eq('id', courseId).single()
    Promise.all([
      courseQuery,
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
  }, [courseId, includeRawNotes])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { course, chapters, loading, error, refetch }
}
