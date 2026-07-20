import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CourseReviewRow } from '@/types/database'

export interface CourseReviewsSummary {
  reviews: CourseReviewRow[]
  averageRating: number | null
}

/** Fetches every review for a course — public read for published courses, see course_reviews_select_published RLS. */
export function useCourseReviews(courseId: string | undefined) {
  const [summary, setSummary] = useState<CourseReviewsSummary>({ reviews: [], averageRating: null })
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!courseId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(
        ({ data }) => {
          const reviews = (data as CourseReviewRow[]) ?? []
          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : null
          setSummary({ reviews, averageRating })
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [courseId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { ...summary, loading, refetch }
}
