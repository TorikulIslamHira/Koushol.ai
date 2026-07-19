import { Link } from 'react-router-dom'
import { useMyEnrollments } from '@/features/enrollment/hooks/useMyEnrollments'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'

/** Student dashboard ("/dashboard") — enrolled courses with progress. */
export function DashboardPage() {
  const { enrollments, loading } = useMyEnrollments()

  if (loading) return <Spinner />

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold">My learning</h1>
        <p className="text-black/60">
          You haven't enrolled in a course yet.{' '}
          <Link to="/courses" className="text-brand-green hover:underline">
            Browse courses →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">My learning</h1>
      <div className="flex flex-col gap-4">
        {enrollments.map((enrollment) => {
          const percent =
            enrollment.chapterCount > 0
              ? Math.min(100, (enrollment.unlocked_chapter_index / enrollment.chapterCount) * 100)
              : 0
          return (
            <Link key={enrollment.id} to={`/courses/${enrollment.course_id}`}>
              <Card className="flex flex-col gap-2">
                <h2 className="font-display font-semibold text-brand-ink">
                  {enrollment.course.title}
                </h2>
                <ProgressBar percent={percent} />
                <p className="text-xs text-black/50">
                  {Math.min(enrollment.unlocked_chapter_index, enrollment.chapterCount)} /{' '}
                  {enrollment.chapterCount} chapters unlocked
                </p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
