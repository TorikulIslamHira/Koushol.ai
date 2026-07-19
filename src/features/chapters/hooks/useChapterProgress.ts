import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ChapterProgressRow } from '@/types/database'

/** Reads a student's progress row for one chapter (quiz_score/completed_at), and can record a new quiz attempt. */
export function useChapterProgress(chapterId: string | undefined) {
  const { session } = useAuth()
  const [progress, setProgress] = useState<ChapterProgressRow | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!chapterId || !session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('chapter_progress')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          setProgress((data as ChapterProgressRow) ?? null)
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [chapterId, session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const recordAttempt = useCallback(
    async (scorePercent: number, passed: boolean) => {
      if (!chapterId || !session) return { error: 'Not signed in' }
      try {
        const { data, error } = await supabase
          .from('chapter_progress')
          .upsert(
            {
              chapter_id: chapterId,
              student_id: session.user.id,
              quiz_score: scorePercent,
              completed_at: passed ? new Date().toISOString() : null,
            },
            { onConflict: 'student_id,chapter_id' },
          )
          .select('*')
          .single()
        if (error) return { error: error.message }
        setProgress(data as ChapterProgressRow)
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to save quiz result.' }
      }
    },
    [chapterId, session],
  )

  return { progress, loading, recordAttempt, refetch }
}
