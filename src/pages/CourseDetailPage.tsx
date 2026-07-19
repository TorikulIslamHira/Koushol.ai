import { useParams, Link } from 'react-router-dom'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { EnrollButton } from '@/features/enrollment/components/EnrollButton'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

/** Course detail page ("/courses/:courseId") — description, chapter list, enroll CTA. */
export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { course, chapters, loading, error } = useCourse(courseId)
  const { enrollment } = useEnrollment(courseId)
  const unlockedIndex = enrollment?.unlocked_chapter_index ?? 0

  if (loading) return <Spinner />
  if (error) return <p className="text-red-600">{error}</p>
  if (!course) return <p className="text-black/60">Course not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-black/60">{course.description}</p>
        </div>
        <EnrollButton course={course} chapters={chapters} />
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">Chapters</h2>
        <ol className="flex flex-col gap-1">
          {chapters.map((chapter) => {
            const isLocked = chapter.order_index > unlockedIndex
            return (
              <li key={chapter.id} className="flex items-center gap-2 text-sm">
                <span className="text-black/40">{chapter.order_index + 1}.</span>
                {isLocked ? (
                  <span className="text-black/40">
                    {chapter.title} <span aria-hidden="true">🔒</span>
                  </span>
                ) : (
                  <Link
                    to={`/courses/${course.id}/chapters/${chapter.id}`}
                    className={cn('text-black/80 hover:text-brand-green hover:underline')}
                  >
                    {chapter.title}
                  </Link>
                )}
                {chapter.order_index === 0 && <Badge tone="green">Free preview</Badge>}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
