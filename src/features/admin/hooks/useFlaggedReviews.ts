import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseReviewRow, CourseRow } from '@/types/database'

export interface FlaggedReview extends CourseReviewRow {
  course: Pick<CourseRow, 'id' | 'title'>
}

/** Fetches every flagged review for the admin moderation queue. RLS ("course_reviews_select_admin") restricts this to admin callers — see supabase/migrations/20260725000000_review_moderation.sql. */
export function useFlaggedReviews() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    supabase
      .from('course_reviews')
      .select('*, course:courses(id, title)')
      .not('flagged_at', 'is', null)
      .order('flagged_at', { ascending: false })
      .then(
        ({ data, error }) => {
          if (error) setError(error.message)
          setReviews((data as FlaggedReview[]) ?? [])
          setLoading(false)
        },
        (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load flagged reviews.')
          setLoading(false)
        },
      )
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { reviews, loading, error, refetch }
}
