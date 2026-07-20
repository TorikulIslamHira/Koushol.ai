import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Toggles a teacher's verified badge. RLS ("users_update_admin") restricts this to admin callers, and the protect_privileged_columns trigger blocks any non-admin self-update of this column regardless — see supabase/migrations/20260722000000_discovery_and_trust.sql. */
export function useUpdateVerifiedTeacher() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateVerifiedTeacher = useCallback(async (userId: string, isVerified: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified_teacher: isVerified })
        .eq('id', userId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update verified status.')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { updateVerifiedTeacher, saving, error }
}
