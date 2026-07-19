import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { formatBDT } from '@/lib/utils'
import type { ChapterRow, CourseRow } from '@/types/database'

/** Enroll CTA on the course detail page — prompts sign-in first if needed, otherwise creates the enrollment row. `chapters` lets "Continue learning" resolve unlocked_chapter_index (a position) to the actual chapter id the route needs. */
export function EnrollButton({ course, chapters }: { course: CourseRow; chapters: ChapterRow[] }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { enrollment, loading, enrolling, error, enroll } = useEnrollment(course.id)

  if (loading) return null

  if (enrollment) {
    const currentChapter =
      chapters.find((c) => c.order_index === enrollment.unlocked_chapter_index) ?? chapters[0]
    return (
      <Button
        variant="secondary"
        disabled={!currentChapter}
        onClick={() => currentChapter && navigate(`/courses/${course.id}/chapters/${currentChapter.id}`)}
      >
        Continue learning
      </Button>
    )
  }

  if (!session) {
    return (
      <Button onClick={() => navigate('/login', { state: { from: `/courses/${course.id}` } })}>
        Sign in to enroll — {formatBDT(course.price)}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={enroll} disabled={enrolling}>
        {enrolling ? 'Enrolling…' : `Enroll — ${formatBDT(course.price)}`}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
