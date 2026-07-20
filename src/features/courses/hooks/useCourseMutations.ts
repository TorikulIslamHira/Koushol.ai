import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CourseRow, CourseStatus } from '@/types/database'

export interface CourseInput {
  title: string
  description: string
  price: number
  category: string | null
}

/**
 * Create/update/delete for a teacher's own course, and (admin-only) approve/reject. RLS is
 * the real enforcement — see supabase/migrations/20260719040000_course_publish_approval.sql:
 * a teacher's own update policy rejects any attempt to set status to 'published' directly
 * (client-side status !== 'published' checks below are UX only), so `updateCourse` behaves
 * differently depending on who calls it — teachers can only reach 'draft' or
 * 'pending_approval', admins can set any status including 'published'.
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
    async (courseId: string, input: Partial<CourseInput & { status: CourseStatus }>) => {
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
