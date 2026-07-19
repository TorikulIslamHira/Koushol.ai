import { BookOpen } from 'lucide-react'
import { CourseCard } from '@/features/courses/components/CourseCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CourseRow } from '@/types/database'

/** Grid of course cards for the browse/catalog page. */
export function CourseList({ courses }: { courses: CourseRow[] }) {
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} title="No published courses yet — check back soon." />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
