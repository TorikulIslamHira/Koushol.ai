import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Lets the current user update their own bio (shown on their public teacher profile). Allowed by the existing users_update_own RLS policy — bio isn't one of the privileged columns the protect_privileged_columns trigger guards. */
export function useUpdateBio() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBio = useCallback(async (userId: string, bio: string) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bio.trim() || null })
        .eq('id', userId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bio.')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { updateBio, saving, error }
}
