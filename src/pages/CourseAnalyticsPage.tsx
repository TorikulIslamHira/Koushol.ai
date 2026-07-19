import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useCourseAnalytics } from '@/features/courses/hooks/useCourseAnalytics'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/ui/StatTile'

/** Own-course analytics page ("/teach/courses/:courseId/analytics") — enrollment count and per-module completion/quiz averages. */
export function CourseAnalyticsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { course, loading: courseLoading } = useCourse(courseId)
  const { analytics, loading, error } = useCourseAnalytics(courseId)
  const { t } = useTranslation()

  if (courseLoading || loading) return <Spinner />
  if (!course || !analytics) return <p className="text-slate-500">{t('common.notFound')}</p>
  if (error) return <p className="text-danger">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/teach/courses/${courseId}`}
        className="flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {course.title}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-brand-ink">{t('analytics.title')}</h1>

      <StatTile label={t('analytics.totalEnrollments')} value={analytics.enrollmentCount} />

      <div className="flex flex-col gap-3">
        {analytics.moduleStats.map(({ module, completedCount, averageScore }) => (
          <Card key={module.id} className="flex items-center justify-between gap-4">
            <span className="font-medium text-brand-ink">
              {module.order_index + 1}. {module.title}
            </span>
            <div className="flex gap-6 text-sm text-slate-500">
              <span>{t('analytics.completed', { count: completedCount })}</span>
              <span>{averageScore === null ? '—' : `${Math.round(averageScore)}% avg`}</span>
            </div>
          </Card>
        ))}
        {analytics.moduleStats.length === 0 && (
          <p className="text-sm text-slate-500">{t('modules.noModulesYet')}</p>
        )}
      </div>
    </div>
  )
}
