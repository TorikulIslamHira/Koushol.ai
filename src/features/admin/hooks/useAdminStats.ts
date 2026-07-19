import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface AdminStats {
  totalUsers: number
  studentCount: number
  teacherCount: number
  adminCount: number
  totalCourses: number
  draftCount: number
  pendingApprovalCount: number
  publishedCount: number
  totalEnrollments: number
}

/** Platform-wide counts for the admin dashboard overview. Relies on the admin RLS policies already on every table (see supabase/migrations/) — no separate authorization needed, a non-admin's queries would just come back empty/denied. */
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load(): Promise<AdminStats> {
      const results = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_approval'),
        supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      ])

      for (const result of results) {
        if (result.error) throw result.error
      }

      const [
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        totalCourses,
        draftCount,
        pendingApprovalCount,
        publishedCount,
        totalEnrollments,
      ] = results.map((r) => r.count ?? 0)

      return {
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        totalCourses,
        draftCount,
        pendingApprovalCount,
        publishedCount,
        totalEnrollments,
      }
    }

    load()
      .then((result) => {
        if (cancelled) return
        setStats(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load platform stats.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading, error }
}
