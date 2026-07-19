import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterRow } from '@/types/database'

export interface ChapterStats {
  chapter: ChapterRow
  completedCount: number
  averageScore: number | null
}

export interface CourseAnalytics {
  enrollmentCount: number
  chapterStats: ChapterStats[]
}

/** Own-course analytics for a teacher: total enrollments, and per-chapter completion count + average quiz score. RLS (owner/admin-only) restricts this to the course's own teacher — see supabase/migrations/20260719010500_create_chapter_progress.sql. */
export function useCourseAnalytics(courseId: string | undefined) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('chapters').select('*').eq('course_id', courseId).order('order_index'),
    ])
      .then(async ([enrollmentRes, chaptersRes]) => {
        if (enrollmentRes.error) throw enrollmentRes.error
        if (chaptersRes.error) throw chaptersRes.error
        const chapters = (chaptersRes.data as ChapterRow[]) ?? []

        const chapterStats = await Promise.all(
          chapters.map(async (chapter): Promise<ChapterStats> => {
            const { data: progressRows, error: progressError } = await supabase
              .from('chapter_progress')
              .select('quiz_score, completed_at')
              .eq('chapter_id', chapter.id)
            if (progressError) throw progressError

            const completed = (progressRows ?? []).filter((r) => r.completed_at !== null)
            const scores = (progressRows ?? [])
              .map((r) => r.quiz_score)
              .filter((s): s is number => s !== null)
            const averageScore =
              scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

            return { chapter, completedCount: completed.length, averageScore }
          }),
        )

        if (cancelled) return
        setAnalytics({ enrollmentCount: enrollmentRes.count ?? 0, chapterStats })
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load analytics.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [courseId])

  return { analytics, loading, error }
}
