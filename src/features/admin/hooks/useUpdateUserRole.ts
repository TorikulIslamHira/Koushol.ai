import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

/** Changes a user's role. RLS ("users_update_admin") restricts this to admin callers — see supabase/migrations/20260719010000_create_users.sql. This is the only self-service-free path to becoming a teacher/admin, matching PROJECT.md Section 3 (no self-service role escalation). */
export function useUpdateUserRole() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRole = useCallback(async (userId: string, role: UserRole) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('users').update({ role }).eq('id', userId)
      if (error) {
        setError(error.message)
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { updateRole, saving, error }
}
