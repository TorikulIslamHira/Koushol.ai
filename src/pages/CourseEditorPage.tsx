import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Trash2 } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { ModuleEditorList } from '@/features/courses/components/ModuleEditorList'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL_KEY } from '@/features/courses/statusDisplay'

/** Course editor ("/teach/courses/:courseId") — edit metadata, submit for admin approval, manage modules, delete, and a link to analytics. Publishing isn't self-service — see useCourseMutations. */
export function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { course, modules, loading, refetch } = useCourse(courseId)
  const { updateCourse, deleteCourse, saving, error } = useCourseMutations()
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (!course || !courseId) return <p className="text-slate-500">{t('teacher.notFound')}</p>

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        overline={t('nav.teach')}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {course.title}
            <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
              {t(COURSE_STATUS_LABEL_KEY[course.status])}
            </Badge>
          </span>
        }
        actions={
          <div className="flex gap-2">
          <Link to={`/teach/courses/${courseId}/analytics`}>
            <Button variant="ghost" className="gap-1.5">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              {t('teacher.analytics')}
            </Button>
          </Link>
          {course.status === 'draft' && (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                await updateCourse(courseId, { status: 'pending_approval' })
                refetch()
              }}
            >
              {t('teacher.submitForReview')}
            </Button>
          )}
          {course.status === 'pending_approval' && (
            <Button
              variant="ghost"
              disabled={saving}
              onClick={async () => {
                await updateCourse(courseId, { status: 'draft' })
                refetch()
              }}
            >
              {t('teacher.withdraw')}
            </Button>
          )}
          {course.status === 'published' && (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                await updateCourse(courseId, { status: 'draft' })
                refetch()
              }}
            >
              {t('teacher.unpublish')}
            </Button>
          )}
          </div>
        }
      />

      <Card className="p-6">
        <CourseForm
          initial={course}
          submitting={saving}
          onSubmit={async (input) => {
            await updateCourse(courseId, input)
            refetch()
          }}
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      <ModuleEditorList courseId={courseId} modules={modules} onChanged={refetch} />

      <button
        type="button"
        className="flex items-center gap-1.5 self-start text-sm text-danger transition-colors duration-150 hover:underline"
        onClick={async () => {
          if (confirm(t('teacher.deleteCourseConfirm', { title: course.title }))) {
            const ok = await deleteCourse(courseId)
            if (ok) navigate('/teach')
          }
        }}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('teacher.deleteCourse')}
      </button>
    </div>
  )
}
