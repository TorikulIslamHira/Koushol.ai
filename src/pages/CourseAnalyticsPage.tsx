import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useCourseAnalytics } from '@/features/courses/hooks/useCourseAnalytics'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/ui/StatTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'

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
      <PageHeader overline={course.title} title={t('analytics.title')} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label={t('analytics.totalEnrollments')} value={analytics.enrollmentCount} />
      </div>

      <div className="flex flex-col gap-3">
        {analytics.moduleStats.map(({ module, completedCount, averageScore }) => {
          const completionPercent =
            analytics.enrollmentCount > 0 ? (completedCount / analytics.enrollmentCount) * 100 : 0
          return (
            <Card key={module.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3 font-medium text-brand-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-display text-xs font-semibold">
                    {String(module.order_index + 1).padStart(2, '0')}
                  </span>
                  {module.title}
                </span>
                <div className="flex shrink-0 gap-6 text-sm text-slate-500">
                  <span>{t('analytics.completed', { count: completedCount })}</span>
                  <span className="font-display font-semibold text-brand-ink">
                    {averageScore === null ? '—' : `${Math.round(averageScore)}%`}
                  </span>
                </div>
              </div>
              <ProgressBar percent={completionPercent} />
            </Card>
          )
        })}
        {analytics.moduleStats.length === 0 && (
          <p className="text-sm text-slate-500">{t('modules.noModulesYet')}</p>
        )}
      </div>
    </div>
  )
}
