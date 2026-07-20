import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseRow } from '@/types/database'

export interface TeacherOnboardingStatus {
  hasCourse: boolean
  hasModuleWithTopics: boolean
  hasQuiz: boolean
  hasSubmitted: boolean
}

/**
 * Derives the teacher onboarding checklist state from existing data (no new table) — a
 * course exists, a module has at least one topic, a module has a saved quiz, and a course
 * has moved past 'draft'. Takes the teacher's own courses (already fetched by
 * useMyCourses) rather than re-fetching them.
 */
export function useTeacherOnboardingStatus(courses: CourseRow[]): TeacherOnboardingStatus | null {
  const [status, setStatus] = useState<TeacherOnboardingStatus | null>(null)

  useEffect(() => {
    if (courses.length === 0) {
      setStatus({ hasCourse: false, hasModuleWithTopics: false, hasQuiz: false, hasSubmitted: false })
      return
    }

    let cancelled = false
    const courseIds = courses.map((c) => c.id)
    const hasSubmitted = courses.some((c) => c.status !== 'draft')

    supabase
      .from('modules')
      .select('id')
      .in('course_id', courseIds)
      .then(async ({ data: modules }) => {
        const moduleIds = (modules ?? []).map((m) => m.id as string)
        if (moduleIds.length === 0) {
          if (!cancelled) {
            setStatus({ hasCourse: true, hasModuleWithTopics: false, hasQuiz: false, hasSubmitted })
          }
          return
        }

        const [{ count: topicCount }, { count: quizCount }] = await Promise.all([
          supabase.from('topics').select('*', { count: 'exact', head: true }).in('module_id', moduleIds),
          supabase.from('quizzes').select('*', { count: 'exact', head: true }).in('module_id', moduleIds),
        ])

        if (!cancelled) {
          setStatus({
            hasCourse: true,
            hasModuleWithTopics: (topicCount ?? 0) > 0,
            hasQuiz: (quizCount ?? 0) > 0,
            hasSubmitted,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [courses])

  return status
}
