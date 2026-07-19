import { Link } from 'react-router-dom'
import { Plus, FolderOpen } from 'lucide-react'
import { useMyCourses } from '@/features/courses/hooks/useMyCourses'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatBDT } from '@/lib/utils'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL } from '@/features/courses/statusDisplay'

/** Teacher dashboard ("/teach") — list of the signed-in teacher's own courses (draft + published), with a link to create a new one. */
export function TeacherDashboardPage() {
  const { courses, loading, error } = useMyCourses()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-brand-ink">My courses</h1>
        <Link to="/teach/courses/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New course
          </Button>
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <EmptyState icon={FolderOpen} title="You haven't created a course yet." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} to={`/teach/courses/${course.id}`} className="group">
            <Card className="flex h-full flex-col gap-2 transition-shadow duration-150 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-brand-ink">{course.title}</h2>
                <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
                  {COURSE_STATUS_LABEL[course.status]}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">{course.description}</p>
              <span className="text-xs text-slate-400">{formatBDT(course.price)}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
