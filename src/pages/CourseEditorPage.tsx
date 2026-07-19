import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { CourseForm } from '@/features/courses/components/CourseForm'
import { AIGenerateCourse } from '@/features/courses/components/AIGenerateCourse'
import { ChapterEditorList } from '@/features/chapters/components/ChapterEditorList'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

/** Course editor ("/teach/courses/:courseId") — edit metadata, publish/unpublish, manage chapters (manually or via AI generation), delete, and a link to analytics. */
export function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { course, chapters, loading, refetch } = useCourse(courseId, { includeRawNotes: true })
  const { updateCourse, deleteCourse, saving, error } = useCourseMutations()

  if (loading) return <Spinner />
  if (!course || !courseId) return <p className="text-black/60">Course not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">{course.title}</h1>
          <Badge tone={course.status === 'published' ? 'green' : 'neutral'}>
            {course.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link to={`/teach/courses/${courseId}/analytics`}>
            <Button variant="ghost">Analytics</Button>
          </Link>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={async () => {
              await updateCourse(courseId, {
                status: course.status === 'published' ? 'draft' : 'published',
              })
              refetch()
            }}
          >
            {course.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <Card>
        <CourseForm
          initial={course}
          submitting={saving}
          onSubmit={async (input) => {
            await updateCourse(courseId, input)
            refetch()
          }}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <ChapterEditorList courseId={courseId} chapters={chapters} onChanged={refetch} />

      <AIGenerateCourse
        courseId={courseId}
        initialNotes={course.raw_notes ?? ''}
        existingChapterCount={chapters.length}
        onApplied={refetch}
      />

      <button
        type="button"
        className="self-start text-sm text-red-600 hover:underline"
        onClick={async () => {
          if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
            const ok = await deleteCourse(courseId)
            if (ok) navigate('/teach')
          }
        }}
      >
        Delete course
      </button>
    </div>
  )
}
