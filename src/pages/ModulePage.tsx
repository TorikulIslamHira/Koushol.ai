import { useState } from 'react'
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { useModuleProgress } from '@/features/courses/hooks/useModuleProgress'
import { useQuiz } from '@/features/quizzes/hooks/useQuiz'
import { TopicReader } from '@/features/chapters/components/TopicReader'
import { TopicTabs } from '@/features/chapters/components/TopicTabs'
import { AudioPlayer } from '@/features/chapters/components/AudioPlayer'
import { useTopicAudio } from '@/features/chapters/hooks/useTopicAudio'
import { TopicVideoPlayer } from '@/features/chapters/components/TopicVideoPlayer'
import { QuizPlayer } from '@/features/quizzes/components/QuizPlayer'
import { TopicNotes } from '@/features/notes/components/TopicNotes'
import { TopicDoubtChat } from '@/features/doubts/components/TopicDoubtChat'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { supabase } from '@/lib/supabase'

/** Module reader + quiz page ("/courses/:courseId/modules/:moduleId"). Topics within the module are freely browsable; passing the module's quiz advances enrollments.unlocked_module_index. */
export function ModulePage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>()
  const { course, modules, loading: courseLoading } = useCourse(courseId)
  const { enrollment, refetch: refetchEnrollment } = useEnrollment(courseId)
  const { progress, recordAttempt } = useModuleProgress(moduleId)
  const { quiz, loading: quizLoading } = useQuiz(moduleId)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const module = modules.find((m) => m.id === moduleId)
  const [searchParams] = useSearchParams()
  const topicFromUrl = searchParams.get('topic') ?? undefined
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(topicFromUrl)
  const { audio } = useTopicAudio(selectedTopicId ?? module?.topics[0]?.id)

  if (courseLoading) return <Spinner />
  if (!course || !moduleId) return <p className="text-slate-500">{t('courses.courseNotFound')}</p>
  if (!module) return <p className="text-slate-500">{t('modules.moduleNotFound')}</p>

  const unlockedIndex = enrollment?.unlocked_module_index ?? 0
  if (module.order_index > unlockedIndex) {
    return <Navigate to={`/courses/${courseId}`} replace />
  }

  const currentTopic = module.topics.find((tp) => tp.id === selectedTopicId) ?? module.topics[0]

  async function handleQuizSubmit(scorePercent: number, passed: boolean) {
    setSubmitting(true)
    await recordAttempt(scorePercent, passed)
    if (passed && enrollment && module!.order_index === enrollment.unlocked_module_index) {
      await supabase
        .from('enrollments')
        .update({ unlocked_module_index: enrollment.unlocked_module_index + 1 })
        .eq('id', enrollment.id)
      refetchEnrollment()
    }
    setSubmitting(false)
  }

  const nextModule = modules.find((m) => m.order_index === module.order_index + 1)
  const progressPercent =
    modules.length > 0 ? Math.min(100, (unlockedIndex / modules.length) * 100) : 0

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[250px_1fr]">
      <aside className="md:sticky md:top-20">
        <Link
          to={`/courses/${courseId}`}
          className="mb-3 flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {course.title}
        </Link>
        <Card className="flex flex-col gap-4 p-4">
          {enrollment && (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                  {t('chapter.unlockedCount', {
                    unlocked: Math.min(unlockedIndex, modules.length),
                    total: modules.length,
                  })}
                </span>
                <span className="font-display text-xs font-semibold text-brand-green">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <ProgressBar percent={progressPercent} />
            </div>
          )}
          <div>
            <h2 className="mb-2 border-b border-slate-100 pb-2 font-display text-sm font-semibold text-brand-ink">
              {module.title}
            </h2>
            {currentTopic && (
              <TopicTabs
                topics={module.topics}
                currentTopicId={currentTopic.id}
                onSelect={setSelectedTopicId}
              />
            )}
          </div>
        </Card>
      </aside>

      <div className="flex flex-col gap-6">
        {currentTopic && (
          <Card className="p-6 sm:p-8">
            <TopicReader topic={currentTopic} />
          </Card>
        )}
        {currentTopic?.video_path && (
          <TopicVideoPlayer topicId={currentTopic.id} videoPath={currentTopic.video_path} />
        )}
        {audio && audio.segments.length > 0 && <AudioPlayer segments={audio.segments} />}
        {enrollment && currentTopic && <TopicNotes topicId={currentTopic.id} />}
        {enrollment && currentTopic && <TopicDoubtChat topicId={currentTopic.id} />}

        {quizLoading && <Spinner />}
        {quiz && quiz.questions.length > 0 && (
          <Card>
            <h3 className="mb-4 font-display text-lg font-semibold text-brand-ink">
              {t('chapter.quiz')}
            </h3>
            {progress?.completed_at ? (
              <p className="text-brand-green">
                {t('chapter.alreadyPassed', { score: progress.quiz_score })}{' '}
                {nextModule && (
                  <Link to={`/courses/${courseId}/modules/${nextModule.id}`} className="underline">
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
