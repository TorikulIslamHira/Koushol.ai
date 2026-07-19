import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QuizQuestion } from '@/types/database'

/** Upserts the (at most one) quiz for a chapter. RLS (owner/admin-only) is the real enforcement — see supabase/migrations/20260719010400_create_quizzes.sql. */
export function useQuizMutations(chapterId: string) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveQuiz = useCallback(
    async (questions: QuizQuestion[]) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase
          .from('quizzes')
          .upsert({ chapter_id: chapterId, questions }, { onConflict: 'chapter_id' })
        if (error) {
          setError(error.message)
          return false
        }
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save quiz.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [chapterId],
  )

  return { saveQuiz, saving, error }
}
