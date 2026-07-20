import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, FolderOpen, Copy } from 'lucide-react'
import { useMyCourses } from '@/features/courses/hooks/useMyCourses'
import { useCloneCourse } from '@/features/courses/hooks/useCloneCourse'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatBDT } from '@/lib/utils'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL_KEY } from '@/features/courses/statusDisplay'
import { OnboardingChecklist } from '@/features/onboarding/components/OnboardingChecklist'

/** Teacher dashboard ("/teach") — list of the signed-in teacher's own courses (draft + published), with a link to create a new one. */
export function TeacherDashboardPage() {
  const { courses, loading, error, refetch } = useMyCourses()
  const { cloneCourse, cloning, error: cloneError } = useCloneCourse()
  const navigate = useNavigate()
  const { t } = useTranslation()

  async function handleClone(courseId: string) {
    const cloned = await cloneCourse(courseId)
    if (cloned) {
      refetch()
      navigate(`/teach/courses/${cloned.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-brand-ink">
          {t('teacher.myCourses')}
        </h1>
        <Link to="/teach/courses/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('teacher.newCourse')}
          </Button>
        </Link>
      </div>

      {!loading && !error && <OnboardingChecklist courses={courses} />}

      {loading && <Spinner />}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <EmptyState icon={FolderOpen} title={t('teacher.noCoursesYet')} />
      )}
      {cloneError && <p className="text-sm text-danger">{cloneError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="group flex h-full flex-col gap-2 transition-shadow duration-150 hover:shadow-md">
            <Link to={`/teach/courses/${course.id}`} className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-brand-ink">{course.title}</h2>
                <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
                  {t(COURSE_STATUS_LABEL_KEY[course.status])}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">{course.description}</p>
              <span className="text-xs text-slate-400">{formatBDT(course.price)}</span>
            </Link>
            <button
              type="button"
              disabled={cloning}
              onClick={() => handleClone(course.id)}
              className="flex items-center gap-1.5 self-start text-xs text-brand-green transition-colors duration-150 hover:underline disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {cloning ? t('teacher.cloning') : t('teacher.cloneCourse')}
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
