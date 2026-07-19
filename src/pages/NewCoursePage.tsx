import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { Card } from '@/components/ui/Card'

/** Course creation page ("/teach/courses/new") — new courses start as drafts (see useCourseMutations). */
export function NewCoursePage() {
  const navigate = useNavigate()
  const { createCourse, saving, error } = useCourseMutations()
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-ink">
        {t('teacher.newCourse')}
      </h1>
      <Card>
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
