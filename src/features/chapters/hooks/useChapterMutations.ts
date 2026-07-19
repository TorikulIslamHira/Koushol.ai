import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterRow } from '@/types/database'

/**
 * Create/update/delete/reorder for a course's chapters. RLS (owner/admin-only) is the real
 * enforcement — see supabase/migrations/20260719010200_create_chapters.sql.
 *
 * order_index must stay contiguous (0..N-1, no gaps): the student-side unlock logic
 * (src/pages/ChapterPage.tsx) matches chapters by exact order_index against
 * enrollments.unlocked_chapter_index, so delete/move here always reindexes the remaining
 * chapters rather than leaving gaps.
 */
export function useChapterMutations(courseId: string, onChanged: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChapter = useCallback(
    async (title: string, content: string, chapterCount: number) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('chapters').insert({
          course_id: courseId,
          order_index: chapterCount,
          title,
          content,
        })
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add chapter.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [courseId, onChanged],
  )

  const updateChapter = useCallback(
    async (chapterId: string, title: string, content: string) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase
          .from('chapters')
          .update({ title, content })
          .eq('id', chapterId)
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save chapter.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [onChanged],
  )

  const reindex = useCallback(
    async (orderedChapters: ChapterRow[]) => {
      await Promise.all(
        orderedChapters.map((chapter, index) =>
          chapter.order_index === index
            ? Promise.resolve()
            : supabase.from('chapters').update({ order_index: index }).eq('id', chapter.id),
        ),
      )
    },
    [],
  )

  const deleteChapter = useCallback(
    async (chapterId: string, remainingChapters: ChapterRow[]) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('chapters').delete().eq('id', chapterId)
        if (error) {
          setError(error.message)
          return false
        }
        await reindex(remainingChapters)
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete chapter.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  const moveChapter = useCallback(
    async (allChapters: ChapterRow[], chapterId: string, direction: 'up' | 'down') => {
      const index = allChapters.findIndex((c) => c.id === chapterId)
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || swapWith < 0 || swapWith >= allChapters.length) return
      setSaving(true)
      setError(null)
      try {
        const reordered = [...allChapters]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(swapWith, 0, moved)
        await reindex(reordered)
        onChanged()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reorder chapters.')
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  return { createChapter, updateChapter, deleteChapter, moveChapter, saving, error }
}
