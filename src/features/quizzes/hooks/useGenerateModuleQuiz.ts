import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QuizQuestion } from '@/types/database'

/**
 * Calls the generate-module-quiz Edge Function (Groq API, server-side — see
 * supabase/functions/generate-module-quiz/index.ts) to draft a quiz from a module's topics.
 * Returns it for review; nothing is written to the DB here — the teacher still saves via
 * useQuizMutations after reviewing/editing the draft in QuizEditor.
 */
export function useGenerateModuleQuiz() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (moduleId: string): Promise<QuizQuestion[] | null> => {
    setGenerating(true)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-module-quiz', {
        body: { moduleId },
      })
      if (error) {
        setError(error.message)
        return null
      }
      if (data?.error) {
        setError(data.error)
        return null
      }
      return data.questions as QuizQuestion[]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz.')
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generate, generating, error }
}
