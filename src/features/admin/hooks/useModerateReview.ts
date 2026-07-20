import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Admin actions on a flagged review: dismiss the flag (clear it, keep the review) or delete the review entirely. RLS ("course_reviews_update_admin"/"course_reviews_delete_own_or_admin") restricts this to admin callers. */
export function useModerateReview() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dismissFlag = useCallback(async (reviewId: string) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('course_reviews')
        .update({ flagged_at: null, flag_reason: null })
        .eq('id', reviewId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteReview = useCallback(async (reviewId: string) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('course_reviews').delete().eq('id', reviewId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } finally {
      setSaving(false)
    }
  }, [])

  return { dismissFlag, deleteReview, saving, error }
}
