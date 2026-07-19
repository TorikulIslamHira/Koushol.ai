import { useNavigate } from 'react-router-dom'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { Card } from '@/components/ui/Card'

/** Course creation page ("/teach/courses/new") — new courses start as drafts (see useCourseMutations). */
export function NewCoursePage() {
  const navigate = useNavigate()
  const { createCourse, saving, error } = useCourseMutations()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-ink">New course</h1>
      <Card>
        <CourseForm
          submitLabel="Create course"
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
