import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { useMyEnrollments } from '@/features/enrollment/hooks/useMyEnrollments'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AccountNav } from '@/features/account/components/AccountNav'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { OnboardingTour } from '@/features/onboarding/components/OnboardingTour'
import { getInitials } from '@/lib/utils'

/** Student dashboard ("/dashboard") — profile summary + enrolled courses with progress. */
export function DashboardPage() {
  const { enrollments, loading } = useMyEnrollments()
  const { profile } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <OnboardingTour />
      <AccountNav />

      {profile && (
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-green font-display text-lg font-semibold text-white">
            {getInitials(profile.name)}
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">{profile.name}</h1>
            <p className="text-sm text-slate-500">{t('dashboard.title')}</p>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t('dashboard.emptyState')}
          action={
            <Link to="/courses">
              <Button variant="ghost">{t('dashboard.browseCourses')}</Button>
            </Link>
          }
        />
      ) : (
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
      )}
    </div>
  )
}
