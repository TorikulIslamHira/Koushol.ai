import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

/** Course creation page ("/teach/courses/new") — new courses start as drafts (see useCourseMutations). */
export function NewCoursePage() {
  const navigate = useNavigate()
  const { createCourse, saving, error } = useCourseMutations()
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader overline={t('nav.teach')} title={t('teacher.newCourse')} className="mb-6" />
      <Card className="p-6">
        <CourseForm
          submitLabel={t('teacher.createCourse')}
          submitting={saving}
          onSubmit={async (input) => {
            const course = await createCourse(input)
            if (course) navigate(`/teach/courses/${course.id}`)
          }}
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>
    </div>
  )
}
