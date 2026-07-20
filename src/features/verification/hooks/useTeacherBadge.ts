import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TeacherBadgeInfo {
  name: string
  is_verified_teacher: boolean
}

/**
 * Public read of a teacher's display name + verified badge via the get_teacher_badge RPC
 * (security definer) rather than a direct select on users — the users table stays locked
 * down (no blanket public SELECT policy that would leak email/role/etc). See
 * supabase/migrations/20260722000000_discovery_and_trust.sql.
 */
export function useTeacherBadge(teacherId: string | undefined) {
  const [badge, setBadge] = useState<TeacherBadgeInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teacherId) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .rpc('get_teacher_badge', { teacher_id: teacherId })
      .then(({ data }) => {
        if (cancelled) return
        const row = Array.isArray(data) ? data[0] : null
        setBadge((row as TeacherBadgeInfo) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [teacherId])

  return { badge, loading }
}
