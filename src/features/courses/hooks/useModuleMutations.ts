import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ModuleRow } from '@/types/database'

/**
 * Create/update/delete/reorder for a course's modules. RLS (owner/admin-only) is the real
 * enforcement — see supabase/migrations/20260719050000_restructure_modules_topics.sql.
 *
 * order_index must stay contiguous (0..N-1, no gaps): the student-side unlock logic
 * (src/pages/ModulePage.tsx) matches modules by exact order_index against
 * enrollments.unlocked_module_index, so delete/move here always reindexes the remaining
 * modules rather than leaving gaps.
 */
export function useModuleMutations(courseId: string, onChanged: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createModule = useCallback(
    async (title: string, moduleCount: number) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('modules').insert({
          course_id: courseId,
          order_index: moduleCount,
          title,
        })
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add module.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [courseId, onChanged],
  )

  const updateModule = useCallback(
    async (moduleId: string, title: string) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('modules').update({ title }).eq('id', moduleId)
        if (error) {
          setError(error.message)
          return false
        }
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save module.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [onChanged],
  )

  const reindex = useCallback(async (orderedModules: ModuleRow[]) => {
    await Promise.all(
      orderedModules.map((module, index) =>
        module.order_index === index
          ? Promise.resolve()
          : supabase.from('modules').update({ order_index: index }).eq('id', module.id),
      ),
    )
  }, [])

  const deleteModule = useCallback(
    async (moduleId: string, remainingModules: ModuleRow[]) => {
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('modules').delete().eq('id', moduleId)
        if (error) {
          setError(error.message)
          return false
        }
        await reindex(remainingModules)
        onChanged()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete module.')
        return false
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  const moveModule = useCallback(
    async (allModules: ModuleRow[], moduleId: string, direction: 'up' | 'down') => {
      const index = allModules.findIndex((m) => m.id === moduleId)
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || swapWith < 0 || swapWith >= allModules.length) return
      setSaving(true)
      setError(null)
      try {
        const reordered = [...allModules]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(swapWith, 0, moved)
        await reindex(reordered)
        onChanged()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reorder modules.')
      } finally {
        setSaving(false)
      }
    },
    [reindex, onChanged],
  )

  return { createModule, updateModule, deleteModule, moveModule, saving, error }
}
