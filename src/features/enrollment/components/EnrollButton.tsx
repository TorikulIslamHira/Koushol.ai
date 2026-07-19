import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { formatBDT } from '@/lib/utils'
import type { ModuleRow, CourseRow } from '@/types/database'

/** Enroll CTA on the course detail page — prompts sign-in first if needed, otherwise creates the enrollment row. `modules` lets "Continue learning" resolve unlocked_module_index (a position) to the actual module id the route needs. */
export function EnrollButton({ course, modules }: { course: CourseRow; modules: ModuleRow[] }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { enrollment, loading, enrolling, error, enroll } = useEnrollment(course.id)

  if (loading) return null

  if (enrollment) {
    const currentModule =
      modules.find((m) => m.order_index === enrollment.unlocked_module_index) ?? modules[0]
    return (
      <Button
        variant="secondary"
        disabled={!currentModule}
        onClick={() => currentModule && navigate(`/courses/${course.id}/modules/${currentModule.id}`)}
      >
        {t('enroll.continueLearning')}
      </Button>
    )
  }

  if (!session) {
    return (
      <Button onClick={() => navigate('/login', { state: { from: `/courses/${course.id}` } })}>
        {t('enroll.signInToEnroll', { price: formatBDT(course.price) })}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={enroll} disabled={enrolling}>
        {enrolling ? t('enroll.enrolling') : t('enroll.enrollFor', { price: formatBDT(course.price) })}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
