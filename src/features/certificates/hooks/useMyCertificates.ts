import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CertificateRow, CourseRow } from '@/types/database'

export interface CertificateWithCourse extends CertificateRow {
  course: CourseRow
}

/** Fetches every certificate the current student has earned, joined with course info, for the account "Certificates" page. */
export function useMyCertificates() {
  const { session } = useAuth()
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('certificates')
      .select('*, course:courses(*)')
      .eq('student_id', session.user.id)
      .order('issued_at', { ascending: false })
      .then(
        ({ data }) => {
          if (cancelled) return
          setCertificates((data as CertificateWithCourse[]) ?? [])
          setLoading(false)
        },
        () => {
          if (!cancelled) setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [session])

  return { certificates, loading }
}
