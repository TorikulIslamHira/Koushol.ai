import { useParams, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { useChapterProgress } from '@/features/chapters/hooks/useChapterProgress'
import { useQuiz } from '@/features/quizzes/hooks/useQuiz'
import { ChapterReader } from '@/features/chapters/components/ChapterReader'
import { ChapterSidebar } from '@/features/chapters/components/ChapterSidebar'
import { AudioPlayer } from '@/features/chapters/components/AudioPlayer'
import { useChapterAudio } from '@/features/chapters/hooks/useChapterAudio'
import { QuizPlayer } from '@/features/quizzes/components/QuizPlayer'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

/** Chapter reader + quiz page ("/courses/:courseId/chapters/:chapterId"). Passing the quiz advances the student's enrollments.unlocked_chapter_index. */
export function ChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const { course, chapters, loading: courseLoading } = useCourse(courseId)
  const { enrollment, refetch: refetchEnrollment } = useEnrollment(courseId)
  const { progress, recordAttempt } = useChapterProgress(chapterId)
  const { quiz, loading: quizLoading } = useQuiz(chapterId)
  const { audio } = useChapterAudio(chapterId)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  if (courseLoading) return <Spinner />
  if (!course || !chapterId) return <p className="text-slate-500">{t('courses.courseNotFound')}</p>

  const chapter = chapters.find((c) => c.id === chapterId)
  if (!chapter) return <p className="text-slate-500">{t('courses.chapterNotFound')}</p>

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
  const progressPercent =
    chapters.length > 0 ? Math.min(100, (unlockedIndex / chapters.length) * 100) : 0

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside>
        <Link
          to={`/courses/${courseId}`}
          className="mb-4 flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {course.title}
        </Link>
        {enrollment && (
          <div className="mb-4">
            <ProgressBar percent={progressPercent} />
            <p className="mt-1 text-xs text-slate-400">
              {t('chapter.unlockedCount', {
                unlocked: Math.min(unlockedIndex, chapters.length),
                total: chapters.length,
              })}
            </p>
          </div>
        )}
        <ChapterSidebar
          courseId={course.id}
          chapters={chapters}
          currentChapterId={chapter.id}
          unlockedIndex={unlockedIndex}
        />
      </aside>

      <div className="flex flex-col gap-8">
        <ChapterReader chapter={chapter} />
        {audio && audio.segments.length > 0 && <AudioPlayer segments={audio.segments} />}

        {quizLoading && <Spinner />}
        {quiz && quiz.questions.length > 0 && (
          <Card>
            <h3 className="mb-4 font-display text-lg font-semibold text-brand-ink">
              {t('chapter.quiz')}
            </h3>
            {progress?.completed_at ? (
              <p className="text-brand-green">
                {t('chapter.alreadyPassed', { score: progress.quiz_score })}{' '}
                {nextChapter && (
                  <Link
                    to={`/courses/${courseId}/chapters/${nextChapter.id}`}
                    className="underline"
                  >
                    {t('chapter.goToNext')}
                  </Link>
                )}
              </p>
            ) : enrollment ? (
              <QuizPlayer quiz={quiz} onSubmit={handleQuizSubmit} submitting={submitting} />
            ) : (
              <p className="text-slate-500">{t('chapter.enrollToTakeQuiz')}</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
