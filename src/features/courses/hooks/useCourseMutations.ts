import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CourseRow, CourseStatus } from '@/types/database'

export interface CourseInput {
  title: string
  description: string
  price: number
}

/**
 * Create/update/delete/publish for a teacher's own course. RLS (owner/admin-only) is the
 * real enforcement — see supabase/migrations/20260719010100_create_courses.sql.
 *
 * Known Phase 2 simplification: PROJECT.md Section 3 lists teacher publish as "needs admin
 * approval", but Phase 5 (the admin dashboard/approval UI) doesn't exist yet. Publishing is
 * self-service for now — revisit once Phase 5 lands.
 */
export function useCourseMutations() {
  const { session } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCourse = useCallback(
    async (input: CourseInput): Promise<CourseRow | null> => {
      if (!session) return null
      setSaving(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('courses')
          .insert({ ...input, teacher_id: session.user.id })
          .select('*')
          .single()
        if (error) {
          setError(error.message)
          return null
        }
        return data as CourseRow
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create course.')
        return null
      } finally {
        setSaving(false)
      }
    },
    [session],
  )

  const updateCourse = useCallback(
    async (
      courseId: string,
      input: Partial<CourseInput & { status: CourseStatus; raw_notes: string }>,
    ) => {
      setSaving(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('courses')
          .update(input)
          .eq('id', courseId)
          .select('*')
          .single()
        if (error) {
          setError(error.message)
          return null
        }
        return data as CourseRow
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save course.')
        return null
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const deleteCourse = useCallback(async (courseId: string) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course.')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { createCourse, updateCourse, deleteCourse, saving, error }
}
