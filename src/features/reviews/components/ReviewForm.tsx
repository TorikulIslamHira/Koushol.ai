import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useReviewMutations } from '@/features/reviews/hooks/useReviewMutations'
import type { CourseReviewRow } from '@/types/database'

/** Star rating (1-5) + comment form for an enrolled student's own review — creates or edits it (upsert). */
export function ReviewForm({
  courseId,
  existing,
  onSaved,
}: {
  courseId: string
  existing: CourseReviewRow | null
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const { saveReview, saving, error } = useReviewMutations(courseId, onSaved)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')

  async function handleSubmit() {
    if (rating === 0) return
    const ok = await saveReview(rating, comment)
    if (ok) onSaved()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={t('reviews.rateStars', { count: value })}
            onClick={() => setRating(value)}
            className="rounded p-0.5"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors duration-150',
                value <= rating ? 'fill-brand-gold text-brand-gold' : 'text-slate-300',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        placeholder={t('reviews.commentPlaceholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="text-sm"
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={saving || rating === 0}
        className="self-start"
      >
        {saving ? t('reviews.saving') : existing ? t('reviews.updateReview') : t('reviews.submitReview')}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
