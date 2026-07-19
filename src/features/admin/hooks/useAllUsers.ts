import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database'

/** Fetches every user for the admin user-management page. RLS ("users_select_admin") restricts this to admin callers — see supabase/migrations/20260719010000_create_users.sql. */
export function useAllUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .then(
        ({ data, error }) => {
          if (error) setError(error.message)
          setUsers((data as UserRow[]) ?? [])
          setLoading(false)
        },
        (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load users.')
          setLoading(false)
        },
      )
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { users, loading, error, refetch }
}
