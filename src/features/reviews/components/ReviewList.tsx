import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFlagReview } from '@/features/reviews/hooks/useFlagReview'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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

/** Inline "Report" control for one review — a signed-in visitor can flag it for admin moderation, with an optional reason. */
function ReportControl({ reviewId }: { reviewId: string }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { flagReview, flagging } = useFlagReview()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reported, setReported] = useState(false)

  if (!session) return null
  if (reported) return <span className="text-xs text-slate-400">{t('reviews.reported')}</span>

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-slate-400 transition-colors duration-150 hover:text-danger"
      >
        <Flag className="h-3 w-3" aria-hidden="true" />
        {t('reviews.report')}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder={t('reviews.reportReasonPlaceholder')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="flex-1 py-1 text-xs"
      />
      <Button
        type="button"
        variant="ghost"
        disabled={flagging}
        onClick={async () => {
          const ok = await flagReview(reviewId, reason)
          if (ok) setReported(true)
        }}
        className="px-2 py-1 text-xs"
      >
        {t('reviews.submitReport')}
      </Button>
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
            <div className="flex items-center justify-between gap-2">
              <StarRow rating={review.rating} />
              <ReportControl reviewId={review.id} />
            </div>
            {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
