import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useModuleMutations } from '@/features/courses/hooks/useModuleMutations'
import { ModuleForm } from '@/features/courses/components/ModuleForm'
import { TopicEditorList } from '@/features/chapters/components/TopicEditorList'
import { useQuiz } from '@/features/quizzes/hooks/useQuiz'
import { useQuizMutations } from '@/features/quizzes/hooks/useQuizMutations'
import { QuizEditor } from '@/features/quizzes/components/QuizEditor'
import { GenerateQuizPanel } from '@/features/quizzes/components/GenerateQuizPanel'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import type { QuizQuestion } from '@/types/database'

/** Module editor page ("/teach/courses/:courseId/modules/:moduleId"): module title, its topics, and its AI-assisted quiz. */
export function TeacherModuleEditorPage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>()
  const { course, modules, loading, refetch } = useCourse(courseId)
  const { updateModule, saving: savingModule } = useModuleMutations(courseId ?? '', refetch)
  const { quiz, loading: quizLoading } = useQuiz(moduleId)
  const { saveQuiz, saving: savingQuiz, error: quizError } = useQuizMutations(moduleId ?? '')
  const { t } = useTranslation()
  const [draftQuestions, setDraftQuestions] = useState<QuizQuestion[] | null>(null)
  const [quizVersion, setQuizVersion] = useState(0)

  if (loading) return <Spinner />
  if (!course || !courseId || !moduleId) return <p className="text-slate-500">{t('modules.notFound')}</p>

  const module = modules.find((m) => m.id === moduleId)
  if (!module) return <p className="text-slate-500">{t('modules.moduleNotFound')}</p>

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/teach/courses/${courseId}`}
        className="flex items-center gap-1 text-sm text-brand-green transition-colors duration-150 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {course.title}
      </Link>
      <h1 className="font-display text-3xl font-bold text-brand-ink">
        {module.title || t('modules.untitled')}
      </h1>

      <Card>
        <ModuleForm
          module={module}
          saving={savingModule}
          onSave={(title) => updateModule(moduleId, title)}
        />
      </Card>

      <TopicEditorList
        courseId={courseId}
        moduleId={moduleId}
        topics={module.topics}
        onChanged={refetch}
      />

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-ink">
          {t('chapter.quiz')}
        </h2>
        {quizLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4">
            <GenerateQuizPanel
              moduleId={moduleId}
              hasTopics={module.topics.length > 0}
              onGenerated={(questions) => {
                setDraftQuestions(questions)
                setQuizVersion((v) => v + 1)
              }}
            />
            <QuizEditor
              key={quizVersion}
              initialQuestions={draftQuestions ?? quiz?.questions ?? []}
              saving={savingQuiz}
              onSave={saveQuiz}
            />
          </div>
        )}
        {quizError && <p className="mt-2 text-sm text-danger">{quizError}</p>}
      </Card>
    </div>
  )
}
