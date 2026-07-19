import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TopicRow } from '@/types/database'

/**
 * Create/update/delete/reorder for a module's topics. RLS (owner/admin-only) is the real
 * enforcement — see supabase/migrations/20260719050000_restructure_modules_topics.sql.
 *
 * order_index must stay contiguous (0..N-1, no gaps) within a module, same invariant as
 * useModuleMutations — delete/move here always reindexes the remaining topics.
 */
export function useTopicMutations(moduleId: string, onChanged: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTopic = useCallback(
    async (title: string, content: string, topicCount: number) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('topics').insert({
          module_id: moduleId,
          order_index: topicCount,
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
        setError(err instanceof Error ? err.message : 'Failed to add topic.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [moduleId, onChanged],
  )

  const updateTopic = useCallback(
    async (topicId: string, title: string, content: string) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase
          .from('topics')
          .update({ title, content })
          .eq('id', topicId)
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save topic.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [onChanged],
  )

  const reindex = useCallback(async (orderedTopics: TopicRow[]) => {
    await Promise.all(
      orderedTopics.map((topic, index) =>
        topic.order_index === index
          ? Promise.resolve()
          : supabase.from('topics').update({ order_index: index }).eq('id', topic.id),
      ),
    )
  }, [])

  const deleteTopic = useCallback(
    async (topicId: string, remainingTopics: TopicRow[]) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('topics').delete().eq('id', topicId)
        if (error) {
          setError(error.message)
          return false
        }
        await reindex(remainingTopics)
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete topic.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  const moveTopic = useCallback(
    async (allTopics: TopicRow[], topicId: string, direction: 'up' | 'down') => {
      const index = allTopics.findIndex((t) => t.id === topicId)
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || swapWith < 0 || swapWith >= allTopics.length) return
      setSaving(true)
      setError(null)
      try {
        const reordered = [...allTopics]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(swapWith, 0, moved)
        await reindex(reordered)
        onChanged()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reorder topics.')
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  return { createTopic, updateTopic, deleteTopic, moveTopic, saving, error }
}
