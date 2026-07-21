import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Trash2, ShieldAlert } from 'lucide-react'
import { useFlaggedReviews } from '@/features/admin/hooks/useFlaggedReviews'
import { useModerateReview } from '@/features/admin/hooks/useModerateReview'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

/** Admin moderation queue ("/admin/moderation") — flagged reviews, dismiss the flag or delete the review. */
export function AdminModerationPage() {
  const { reviews, loading, error, refetch } = useFlaggedReviews()
  const { dismissFlag, deleteReview, saving } = useModerateReview()
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <PageHeader overline={t('nav.admin')} title={t('admin.moderationTitle')} />

      {reviews.length === 0 && (
        <EmptyState icon={ShieldAlert} title={t('admin.noFlaggedReviews')} />
      )}

      <div className="flex flex-col gap-2">
        {reviews.map((review) => (
          <Card key={review.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  to={`/courses/${review.course.id}`}
                  className="font-medium text-brand-ink hover:text-brand-green hover:underline"
                >
                  {review.course.title}
                </Link>
                <p className="text-sm text-slate-500">{'★'.repeat(review.rating)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  disabled={saving}
                  className="gap-1.5"
                  onClick={async () => {
                    await dismissFlag(review.id)
                    refetch()
                  }}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {t('admin.dismissFlag')}
                </Button>
                <Button
                  variant="danger"
                  disabled={saving}
                  className="gap-1.5"
                  onClick={async () => {
                    await deleteReview(review.id)
                    refetch()
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t('admin.deleteReview')}
                </Button>
              </div>
            </div>
            {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
            {review.flag_reason && (
              <p className="text-xs text-danger">
                {t('admin.flagReason', { reason: review.flag_reason })}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
