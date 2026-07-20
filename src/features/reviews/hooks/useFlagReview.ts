import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Flags a review for admin moderation via the flag_review RPC — any signed-in user can report a review (not just its author or an enrolled student), since reviews are publicly visible. See supabase/migrations/20260725000000_review_moderation.sql. */
export function useFlagReview() {
  const [flagging, setFlagging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const flagReview = useCallback(async (reviewId: string, reason: string) => {
    setFlagging(true)
    setError(null)
    try {
      const { error } = await supabase.rpc('flag_review', { review_id: reviewId, reason })
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report review.')
      return false
    } finally {
      setFlagging(false)
    }
  }, [])

  return { flagReview, flagging, error }
}
