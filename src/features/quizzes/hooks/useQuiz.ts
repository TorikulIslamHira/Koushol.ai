import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QuizRow } from '@/types/database'

/** Fetches the quiz (if any) attached to a chapter. Grading happens client-side for Phase 1 — see the note in supabase/migrations/20260719010400_create_quizzes.sql. */
export function useQuiz(chapterId: string | undefined) {
  const [quiz, setQuiz] = useState<QuizRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chapterId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('quizzes')
      .select('*')
      .eq('chapter_id', chapterId)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (cancelled) return
          setQuiz((data as QuizRow) ?? null)
          setLoading(false)
        },
        () => {
          if (!cancelled) setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [chapterId])

  return { quiz, loading }
}
