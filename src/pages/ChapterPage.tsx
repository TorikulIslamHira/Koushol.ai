import { useParams, Navigate, Link } from 'react-router-dom'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { useChapterProgress } from '@/features/chapters/hooks/useChapterProgress'
import { useQuiz } from '@/features/quizzes/hooks/useQuiz'
import { ChapterReader } from '@/features/chapters/components/ChapterReader'
import { ChapterSidebar } from '@/features/chapters/components/ChapterSidebar'
import { QuizPlayer } from '@/features/quizzes/components/QuizPlayer'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

/** Chapter reader + quiz page ("/courses/:courseId/chapters/:chapterId"). Passing the quiz advances the student's enrollments.unlocked_chapter_index. */
export function ChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const { course, chapters, loading: courseLoading } = useCourse(courseId)
  const { enrollment, refetch: refetchEnrollment } = useEnrollment(courseId)
  const { progress, recordAttempt } = useChapterProgress(chapterId)
  const { quiz, loading: quizLoading } = useQuiz(chapterId)
  const [submitting, setSubmitting] = useState(false)

  if (courseLoading) return <Spinner />
  if (!course || !chapterId) return <p className="text-black/60">Course not found.</p>

  const chapter = chapters.find((c) => c.id === chapterId)
  if (!chapter) return <p className="text-black/60">Chapter not found.</p>

  const unlockedIndex = enrollment?.unlocked_chapter_index ?? 0
  if (chapter.order_index > unlockedIndex) {
    return <Navigate to={`/courses/${courseId}`} replace />
  }

  async function handleQuizSubmit(scorePercent: number, passed: boolean) {
    setSubmitting(true)
    await recordAttempt(scorePercent, passed)
    if (passed && enrollment && chapter!.order_index === enrollment.unlocked_chapter_index) {
      await supabase
        .from('enrollments')
        .update({ unlocked_chapter_index: enrollment.unlocked_chapter_index + 1 })
        .eq('id', enrollment.id)
      refetchEnrollment()
    }
    setSubmitting(false)
  }

  const nextChapter = chapters.find((c) => c.order_index === chapter.order_index + 1)

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside>
        <Link to={`/courses/${courseId}`} className="mb-4 block text-sm text-brand-green hover:underline">
          ← {course.title}
        </Link>
        <ChapterSidebar
          courseId={course.id}
          chapters={chapters}
          currentChapterId={chapter.id}
          unlockedIndex={unlockedIndex}
        />
      </aside>

      <div className="flex flex-col gap-8">
        <ChapterReader chapter={chapter} />

        {quizLoading && <Spinner />}
        {quiz && quiz.questions.length > 0 && (
          <Card>
            <h3 className="mb-4 font-display text-lg font-semibold">Quiz</h3>
            {progress?.completed_at ? (
              <p className="text-brand-green">
                Already passed with {progress.quiz_score}%.{' '}
                {nextChapter && (
                  <Link
                    to={`/courses/${courseId}/chapters/${nextChapter.id}`}
                    className="underline"
                  >
                    Go to next chapter →
                  </Link>
                )}
              </p>
            ) : enrollment ? (
              <QuizPlayer quiz={quiz} onSubmit={handleQuizSubmit} submitting={submitting} />
            ) : (
              <p className="text-black/60">
                Enroll in this course to take the quiz and track your progress.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
