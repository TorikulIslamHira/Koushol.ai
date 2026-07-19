import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminCourses } from '@/features/admin/hooks/useAdminCourses'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL } from '@/features/courses/statusDisplay'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatBDT } from '@/lib/utils'
import type { CourseStatus } from '@/types/database'

const FILTERS: { label: string; value: CourseStatus | undefined }[] = [
  { label: 'Pending review', value: 'pending_approval' },
  { label: 'All courses', value: undefined },
]

/** Admin course review ("/admin/courses") — approve/reject submitted courses; also browsable as an all-courses list across every teacher. */
export function AdminCourseReviewPage() {
  const [filter, setFilter] = useState<CourseStatus | undefined>('pending_approval')
  const { courses, loading, error, refetch } = useAdminCourses(filter)
  const { updateCourse, saving } = useCourseMutations()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">Course review</h1>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? 'rounded-lg bg-brand-green/10 px-3 py-1.5 text-sm font-medium text-brand-green'
                : 'rounded-lg px-3 py-1.5 text-sm text-black/60 hover:bg-black/5'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && courses.length === 0 && (
        <p className="text-black/60">Nothing here.</p>
      )}

      <div className="flex flex-col gap-2">
        {courses.map((course) => (
          <Card key={course.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/courses/${course.id}`}
                  className="font-medium hover:text-brand-green hover:underline"
                >
                  {course.title}
                </Link>
                <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
                  {COURSE_STATUS_LABEL[course.status]}
                </Badge>
              </div>
              <p className="text-sm text-black/60">{formatBDT(course.price)}</p>
            </div>
            {course.status === 'pending_approval' && (
              <div className="flex gap-2">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    await updateCourse(course.id, { status: 'published' })
                    refetch()
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={async () => {
                    await updateCourse(course.id, { status: 'draft' })
                    refetch()
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
