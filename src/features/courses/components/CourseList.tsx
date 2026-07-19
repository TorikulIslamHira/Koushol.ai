import { CourseCard } from '@/features/courses/components/CourseCard'
import type { CourseRow } from '@/types/database'

/** Grid of course cards for the browse/catalog page. */
export function CourseList({ courses }: { courses: CourseRow[] }) {
  if (courses.length === 0) {
    return <p className="text-black/60">No published courses yet — check back soon.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
