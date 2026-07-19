import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GeneratedChapter } from '@/features/courses/hooks/useGenerateCourse'

/**
 * Writes AI-generated chapters + their quizzes to the DB, appended after the course's
 * existing chapters. Sequential (not parallel) so order_index assignment can't race —
 * order_index must stay contiguous, same constraint as useChapterMutations.
 */
export function useApplyGeneratedChapters(courseId: string, startIndex: number, onDone: () => void) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(
    async (chapters: GeneratedChapter[]) => {
      setApplying(true)
      setError(null)
      try {
        for (let i = 0; i < chapters.length; i++) {
          const generated = chapters[i]
          const { data: chapterRow, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              course_id: courseId,
              order_index: startIndex + i,
              title: generated.title,
              content: generated.content,
              is_ai_generated: true,
            })
            .select('id')
            .single()
          if (chapterError) {
            setError(`Chapter ${i + 1} ("${generated.title}"): ${chapterError.message}`)
            return false
          }
          const { error: quizError } = await supabase
            .from('quizzes')
            .insert({ chapter_id: chapterRow.id, questions: generated.questions })
          if (quizError) {
            setError(`Quiz for chapter ${i + 1} ("${generated.title}"): ${quizError.message}`)
            return false
          }
        }
        onDone()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save generated chapters.')
        return false
      } finally {
        setApplying(false)
      }
    },
    [courseId, startIndex, onDone],
  )

  return { apply, applying, error }
}
