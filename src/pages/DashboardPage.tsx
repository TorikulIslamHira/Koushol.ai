import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { useMyEnrollments } from '@/features/enrollment/hooks/useMyEnrollments'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

/** Student dashboard ("/dashboard") — enrolled courses with progress. */
export function DashboardPage() {
  const { enrollments, loading } = useMyEnrollments()
  const { t } = useTranslation()

  if (loading) return <Spinner />

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold text-brand-ink">
          {t('dashboard.title')}
        </h1>
        <EmptyState
          icon={GraduationCap}
          title={t('dashboard.emptyState')}
          action={
            <Link to="/courses">
              <Button variant="ghost">{t('dashboard.browseCourses')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">
        {t('dashboard.title')}
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => {
          const percent =
            enrollment.moduleCount > 0
              ? Math.min(100, (enrollment.unlocked_module_index / enrollment.moduleCount) * 100)
              : 0
          return (
            <Link key={enrollment.id} to={`/courses/${enrollment.course_id}`} className="group">
              <Card className="flex h-full flex-col gap-3 transition-shadow duration-150 group-hover:shadow-md">
                <h2 className="font-display font-semibold text-brand-ink">
                  {enrollment.course.title}
                </h2>
                <ProgressBar percent={percent} />
                <p className="text-xs text-slate-400">
                  {t('dashboard.chaptersUnlocked', {
                    unlocked: Math.min(enrollment.unlocked_module_index, enrollment.moduleCount),
                    total: enrollment.moduleCount,
                  })}
                </p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
