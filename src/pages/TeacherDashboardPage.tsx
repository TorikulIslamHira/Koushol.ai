import { Link } from 'react-router-dom'
import { useMyCourses } from '@/features/courses/hooks/useMyCourses'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatBDT } from '@/lib/utils'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL } from '@/features/courses/statusDisplay'

/** Teacher dashboard ("/teach") — list of the signed-in teacher's own courses (draft + published), with a link to create a new one. */
export function TeacherDashboardPage() {
  const { courses, loading, error } = useMyCourses()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">My courses</h1>
        <Link to="/teach/courses/new">
          <Button>+ New course</Button>
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p className="text-black/60">You haven't created a course yet.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} to={`/teach/courses/${course.id}`}>
            <Card className="flex h-full flex-col gap-2 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-brand-ink">{course.title}</h2>
                <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
                  {COURSE_STATUS_LABEL[course.status]}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-black/60">{course.description}</p>
              <span className="text-xs text-black/40">{formatBDT(course.price)}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
