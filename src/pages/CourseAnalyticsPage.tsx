import { useParams, Link } from 'react-router-dom'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useCourseAnalytics } from '@/features/courses/hooks/useCourseAnalytics'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

/** Own-course analytics page ("/teach/courses/:courseId/analytics") — enrollment count and per-chapter completion/quiz averages. */
export function CourseAnalyticsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { course, loading: courseLoading } = useCourse(courseId)
  const { analytics, loading, error } = useCourseAnalytics(courseId)

  if (courseLoading || loading) return <Spinner />
  if (!course || !analytics) return <p className="text-black/60">Not found.</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <Link to={`/teach/courses/${courseId}`} className="text-sm text-brand-green hover:underline">
        ← {course.title}
      </Link>
      <h1 className="font-display text-2xl font-semibold">Analytics</h1>

      <Card>
        <p className="text-sm text-black/60">Total enrollments</p>
        <p className="font-display text-3xl font-semibold text-brand-ink">
          {analytics.enrollmentCount}
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        {analytics.chapterStats.map(({ chapter, completedCount, averageScore }) => (
          <Card key={chapter.id} className="flex items-center justify-between gap-4">
            <span className="font-medium">
              {chapter.order_index + 1}. {chapter.title}
            </span>
            <div className="flex gap-6 text-sm text-black/60">
              <span>{completedCount} completed</span>
              <span>{averageScore === null ? '—' : `${Math.round(averageScore)}% avg`}</span>
            </div>
          </Card>
        ))}
        {analytics.chapterStats.length === 0 && (
          <p className="text-sm text-black/60">No chapters yet.</p>
        )}
      </div>
    </div>
  )
}
