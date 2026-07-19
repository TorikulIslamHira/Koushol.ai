import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseRow, ModuleRow, TopicRow } from '@/types/database'

export interface ModuleWithTopics extends ModuleRow {
  topics: TopicRow[]
}

/**
 * Fetches one course plus its modules (ordered) each with their ordered topics, for the
 * course detail / reader / teacher editor pages. Visibility beyond the free-preview topic
 * (first topic of the first module) is enforced by RLS, not here.
 */
export function useCourse(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseRow | null>(null)
  const [modules, setModules] = useState<ModuleWithTopics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!courseId) return
    setLoading(true)
    Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('modules').select('*').eq('course_id', courseId).order('order_index'),
    ])
      .then(async ([courseRes, modulesRes]) => {
        if (courseRes.error) setError(courseRes.error.message)
        setCourse((courseRes.data as CourseRow) ?? null)
        const moduleRows = (modulesRes.data as ModuleRow[]) ?? []

        if (moduleRows.length === 0) {
          setModules([])
          setLoading(false)
          return
        }

        const { data: topicRows } = await supabase
          .from('topics')
          .select('*')
          .in(
            'module_id',
            moduleRows.map((m) => m.id),
          )
          .order('order_index')

        const topicsByModule = new Map<string, TopicRow[]>()
        for (const topic of (topicRows as TopicRow[]) ?? []) {
          const list = topicsByModule.get(topic.module_id) ?? []
          list.push(topic)
          topicsByModule.set(topic.module_id, list)
        }

        setModules(moduleRows.map((m) => ({ ...m, topics: topicsByModule.get(m.id) ?? [] })))
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

  return { course, modules, loading, error, refetch }
}
