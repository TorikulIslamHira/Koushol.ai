import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Create/update/delete the current student's own review for a course. RLS (enrolled
 * students only, own row) is the real enforcement — see
 * supabase/migrations/20260722000000_discovery_and_trust.sql.
 */
export function useReviewMutations(courseId: string, onChanged: () => void) {
  const { session } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveReview = useCallback(
    async (rating: number, comment: string) => {
      if (!session) return false
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('course_reviews').upsert(
          {
            course_id: courseId,
            student_id: session.user.id,
            rating,
            comment: comment.trim() || null,
          },
          { onConflict: 'student_id,course_id' },
        )
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save review.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [courseId, session, onChanged],
  )

  const deleteReview = useCallback(
    async (reviewId: string) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('course_reviews').delete().eq('id', reviewId)
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete review.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [onChanged],
  )

  return { saveReview, deleteReview, saving, error }
}
