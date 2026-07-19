import { useCourses } from '@/features/courses/hooks/useCourses'
import { CourseList } from '@/features/courses/components/CourseList'
import { Spinner } from '@/components/ui/Spinner'

/** Course catalog / browse page ("/courses"). */
export function CoursesPage() {
  const { courses, loading, error } = useCourses()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">Courses</h1>
      {loading && <Spinner />}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && <CourseList courses={courses} />}
    </div>
  )
}
