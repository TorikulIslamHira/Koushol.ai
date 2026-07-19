import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ModuleProgressRow } from '@/types/database'

/** Reads a student's progress row for one module (quiz_score/completed_at), and can record a new quiz attempt. */
export function useModuleProgress(moduleId: string | undefined) {
  const { session } = useAuth()
  const [progress, setProgress] = useState<ModuleProgressRow | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!moduleId || !session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('module_progress')
      .select('*')
      .eq('module_id', moduleId)
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          setProgress((data as ModuleProgressRow) ?? null)
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [moduleId, session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const recordAttempt = useCallback(
    async (scorePercent: number, passed: boolean) => {
      if (!moduleId || !session) return { error: 'Not signed in' }
      try {
        const { data, error } = await supabase
          .from('module_progress')
          .upsert(
            {
              module_id: moduleId,
              student_id: session.user.id,
              quiz_score: scorePercent,
              completed_at: passed ? new Date().toISOString() : null,
            },
            { onConflict: 'student_id,module_id' },
          )
          .select('*')
          .single()
        if (error) return { error: error.message }
        setProgress(data as ModuleProgressRow)
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to save quiz result.' }
      }
    },
    [moduleId, session],
  )

  return { progress, loading, recordAttempt, refetch }
}
