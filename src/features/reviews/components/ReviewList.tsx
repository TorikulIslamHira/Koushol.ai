import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CourseReviewRow } from '@/types/database'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn('h-3.5 w-3.5', value <= rating ? 'fill-brand-gold text-brand-gold' : 'text-slate-300')}
        />
      ))}
    </div>
  )
}

/** Public list of a course's reviews plus its average rating — readable even signed out (course_reviews_select_published RLS). */
export function ReviewList({
  reviews,
  averageRating,
}: {
  reviews: CourseReviewRow[]
  averageRating: number | null
}) {
  const { t } = useTranslation()

  if (reviews.length === 0) {
    return <p className="text-sm text-slate-500">{t('reviews.noReviewsYet')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {averageRating !== null && (
        <div className="flex items-center gap-2">
          <StarRow rating={Math.round(averageRating)} />
          <span className="text-sm text-slate-600">
            {t('reviews.averageRating', { rating: averageRating.toFixed(1), count: reviews.length })}
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-1 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
            <StarRow rating={review.rating} />
            {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
