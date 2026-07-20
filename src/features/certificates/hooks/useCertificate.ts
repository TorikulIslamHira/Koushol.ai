import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { CertificateRow } from '@/types/database'

/**
 * Reads (and can issue) the current student's certificate for a course. Issuance is a
 * plain insert — the real gate is the certificates_insert_own RLS policy (see
 * supabase/migrations/20260721000000_certificate_issuance.sql), which only allows it once
 * every module of the course is actually unlocked. A unique-violation on insert just means
 * one already exists (the unique(student_id, course_id) constraint), so it's treated as
 * success rather than surfaced as an error.
 */
export function useCertificate(courseId: string | undefined) {
  const { session } = useAuth()
  const [certificate, setCertificate] = useState<CertificateRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)

  const refetch = useCallback(() => {
    if (!courseId || !session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          setCertificate((data as CertificateRow) ?? null)
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [courseId, session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const issue = useCallback(async (): Promise<CertificateRow | null> => {
    if (!courseId || !session) return null
    setIssuing(true)
    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({ course_id: courseId, student_id: session.user.id })
        .select('*')
        .single()
      if (!error && data) {
        const row = data as CertificateRow
        setCertificate(row)
        return row
      }
      // Unique violation (23505) means it's already issued — fetch the existing row.
      if (error?.code === '23505') {
        refetch()
      }
      return null
    } finally {
      setIssuing(false)
    }
  }, [courseId, session, refetch])

  return { certificate, loading, issuing, issue }
}
