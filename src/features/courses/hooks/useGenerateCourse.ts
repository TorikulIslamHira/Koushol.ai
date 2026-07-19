import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QuizQuestion } from '@/types/database'

export interface GeneratedChapter {
  title: string
  content: string
  questions: QuizQuestion[]
}

/**
 * Calls the generate-course Edge Function (Groq API, server-side — see
 * supabase/functions/generate-course/index.ts) to turn raw notes into draft chapters +
 * quizzes. Returns them for review; nothing is written to the DB here — see
 * AIGenerateCourse's "Add to course" step for that.
 */
export function useGenerateCourse() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (courseId: string, rawNotes: string): Promise<GeneratedChapter[] | null> => {
      setGenerating(true)
      setError(null)
      try {
        const { data, error } = await supabase.functions.invoke('generate-course', {
          body: { courseId, rawNotes },
        })
        if (error) {
          setError(error.message)
          return null
        }
        if (data?.error) {
          setError(data.error)
          return null
        }
        return data.chapters as GeneratedChapter[]
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate course.')
        return null
      } finally {
        setGenerating(false)
      }
    },
    [],
  )

  return { generate, generating, error }
}
