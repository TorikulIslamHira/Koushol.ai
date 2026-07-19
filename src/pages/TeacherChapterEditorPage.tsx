import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useChapterMutations } from '@/features/chapters/hooks/useChapterMutations'
import { ChapterForm } from '@/features/chapters/components/ChapterForm'
import { useQuiz } from '@/features/quizzes/hooks/useQuiz'
import { useQuizMutations } from '@/features/quizzes/hooks/useQuizMutations'
import { QuizEditor } from '@/features/quizzes/components/QuizEditor'
import { GenerateAudioPanel } from '@/features/chapters/components/GenerateAudioPanel'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

/** Chapter content + quiz editor ("/teach/courses/:courseId/chapters/:chapterId"). */
export function TeacherChapterEditorPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const { course, chapters, loading, refetch } = useCourse(courseId)
  const { updateChapter, saving: savingChapter } = useChapterMutations(courseId ?? '', refetch)
  const { quiz, loading: quizLoading } = useQuiz(chapterId)
  const { saveQuiz, saving: savingQuiz, error: quizError } = useQuizMutations(chapterId ?? '')

  if (loading) return <Spinner />
  if (!course || !courseId || !chapterId) return <p className="text-slate-500">Not found.</p>

  const chapter = chapters.find((c) => c.id === chapterId)
  if (!chapter) return <p className="text-slate-500">Chapter not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/teach/courses/${courseId}`}
        className="flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {course.title}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-brand-ink">
        {chapter.title || '(untitled)'}
      </h1>

      <Card>
        <ChapterForm
          chapter={chapter}
          saving={savingChapter}
          onSave={(title, content) => updateChapter(chapterId, title, content)}
        />
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-ink">Quiz</h2>
        {quizLoading ? (
          <Spinner />
        ) : (
          <QuizEditor
            initialQuestions={quiz?.questions ?? []}
            saving={savingQuiz}
            onSave={saveQuiz}
          />
        )}
        {quizError && <p className="mt-2 text-sm text-danger">{quizError}</p>}
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-ink">Audio</h2>
        <GenerateAudioPanel chapterId={chapterId} />
      </Card>
    </div>
  )
}
