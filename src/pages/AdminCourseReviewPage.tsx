import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ClipboardCheck } from 'lucide-react'
import { useAdminCourses } from '@/features/admin/hooks/useAdminCourses'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'
import { COURSE_STATUS_BADGE_TONE, COURSE_STATUS_LABEL } from '@/features/courses/statusDisplay'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatBDT, cn } from '@/lib/utils'
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
      <h1 className="font-display text-2xl font-semibold text-brand-ink">Course review</h1>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150',
              filter === f.value
                ? 'bg-brand-green/10 text-brand-green'
                : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && courses.length === 0 && (
        <EmptyState icon={ClipboardCheck} title="Nothing here." />
      )}

      <div className="flex flex-col gap-2">
        {courses.map((course) => (
          <Card key={course.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/courses/${course.id}`}
                  className="font-medium text-brand-ink hover:text-brand-green hover:underline"
                >
                  {course.title}
                </Link>
                <Badge tone={COURSE_STATUS_BADGE_TONE[course.status]}>
                  {COURSE_STATUS_LABEL[course.status]}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{formatBDT(course.price)}</p>
            </div>
            {course.status === 'pending_approval' && (
              <div className="flex gap-2">
                <Button
                  disabled={saving}
                  className="gap-1.5"
                  onClick={async () => {
                    await updateCourse(course.id, { status: 'published' })
                    refetch()
                  }}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving}
                  className="gap-1.5"
                  onClick={async () => {
                    await updateCourse(course.id, { status: 'draft' })
                    refetch()
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
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
