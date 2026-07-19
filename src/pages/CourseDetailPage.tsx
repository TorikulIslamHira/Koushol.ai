import { useParams, Link } from 'react-router-dom'
import { BookOpen, Lock, CheckCircle2 } from 'lucide-react'
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
  if (error) return <p className="text-danger">{error}</p>
  if (!course) return <p className="text-slate-500">Course not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark">
        <BookOpen className="h-10 w-10 text-white/80" aria-hidden="true" strokeWidth={1.5} />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{course.description}</p>
        </div>
        <EnrollButton course={course} chapters={chapters} />
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-brand-ink">Chapters</h2>
        <ol className="flex flex-col gap-1">
          {chapters.map((chapter) => {
            const isLocked = chapter.order_index > unlockedIndex
            const isCompleted = chapter.order_index < unlockedIndex
            return (
              <li
                key={chapter.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              >
                <span className="w-5 shrink-0 text-slate-400">{chapter.order_index + 1}.</span>
                {isLocked ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    {chapter.title}
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Link
                    to={`/courses/${course.id}/chapters/${chapter.id}`}
                    className={cn(
                      'flex items-center gap-1.5 text-slate-700 transition-colors duration-150 hover:text-brand-green hover:underline',
                    )}
                  >
                    {isCompleted && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-brand-green"
                        aria-hidden="true"
                      />
                    )}
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
