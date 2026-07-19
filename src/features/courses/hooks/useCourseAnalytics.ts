import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ModuleRow } from '@/types/database'

export interface ModuleStats {
  module: ModuleRow
  completedCount: number
  averageScore: number | null
}

export interface CourseAnalytics {
  enrollmentCount: number
  moduleStats: ModuleStats[]
}

/** Own-course analytics for a teacher: total enrollments, and per-module completion count + average quiz score. RLS (owner/admin-only) restricts this to the course's own teacher — see supabase/migrations/20260719050000_restructure_modules_topics.sql. */
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
      supabase.from('modules').select('*').eq('course_id', courseId).order('order_index'),
    ])
      .then(async ([enrollmentRes, modulesRes]) => {
        if (enrollmentRes.error) throw enrollmentRes.error
        if (modulesRes.error) throw modulesRes.error
        const modules = (modulesRes.data as ModuleRow[]) ?? []

        const moduleStats = await Promise.all(
          modules.map(async (module): Promise<ModuleStats> => {
            const { data: progressRows, error: progressError } = await supabase
              .from('module_progress')
              .select('quiz_score, completed_at')
              .eq('module_id', module.id)
            if (progressError) throw progressError

            const completed = (progressRows ?? []).filter((r) => r.completed_at !== null)
            const scores = (progressRows ?? [])
              .map((r) => r.quiz_score)
              .filter((s): s is number => s !== null)
            const averageScore =
              scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

            return { module, completedCount: completed.length, averageScore }
          }),
        )

        if (cancelled) return
        setAnalytics({ enrollmentCount: enrollmentRes.count ?? 0, moduleStats })
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
