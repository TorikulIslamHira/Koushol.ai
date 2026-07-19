import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useGenerateModuleQuiz } from '@/features/quizzes/hooks/useGenerateModuleQuiz'
import type { QuizQuestion } from '@/types/database'

/**
 * "Generate quiz with AI" trigger on the module editor: drafts questions from the module's
 * topics via Groq, then hands them to the parent (which remounts QuizEditor with a new `key`
 * so it picks up the draft as its initial state — the teacher can still edit/add/remove
 * questions before saving, same as if they'd written the quiz by hand).
 */
export function GenerateQuizPanel({
  moduleId,
  hasTopics,
  onGenerated,
}: {
  moduleId: string
  hasTopics: boolean
  onGenerated: (questions: QuizQuestion[]) => void
}) {
  const { t } = useTranslation()
  const { generate, generating, error } = useGenerateModuleQuiz()

  async function handleGenerate() {
    const questions = await generate(moduleId)
    if (questions) onGenerated(questions)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleGenerate}
        disabled={generating || !hasTopics}
        className="gap-1.5 self-start"
      >
        <Sparkles className="h-4 w-4 text-brand-gold" aria-hidden="true" />
        {generating ? t('quizEditor.generating') : t('quizEditor.generateWithAi')}
      </Button>
      {!hasTopics && <p className="text-xs text-slate-500">{t('quizEditor.needsTopicsFirst')}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
