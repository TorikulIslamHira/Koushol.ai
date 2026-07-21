import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

interface VerificationResult {
  course_title: string
  student_name: string
  issued_at: string
}

/**
 * Public certificate verification page ("/verify/:certificateId") — calls the
 * verify_certificate security-definer RPC rather than selecting the certificates table
 * directly, so an anonymous visitor can only ever look up one certificate by its
 * (unguessable) id, not read the whole table. See
 * supabase/migrations/20260721000000_certificate_issuance.sql.
 */
export function VerifyCertificatePage() {
  const { certificateId } = useParams<{ certificateId: string }>()
  const { t } = useTranslation()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!certificateId) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .rpc('verify_certificate', { cert_id: certificateId })
      .then(({ data }) => {
        if (cancelled) return
        const row = Array.isArray(data) ? data[0] : null
        setResult((row as VerificationResult) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [certificateId])

  if (loading) return <Spinner />

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
      {result ? (
        <Card className="w-full overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-brand-green via-brand-green-light to-brand-gold" />
          <div className="flex flex-col items-center gap-3 px-6 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10">
              <BadgeCheck className="h-8 w-8 text-brand-green" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider text-brand-gold uppercase">Koushol</p>
            <h1 className="font-display text-2xl font-bold text-brand-ink">
              {t('certificate.verify.verified')}
            </h1>
            <p className="leading-relaxed text-slate-600">
              {t('certificate.verify.statement', {
                name: result.student_name,
                course: result.course_title,
              })}
            </p>
            <p className="mt-1 border-t border-slate-100 pt-3 text-sm text-slate-400">
              {t('certificate.verify.issuedOn', {
                date: new Date(result.issued_at).toLocaleDateString(),
              })}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex w-full flex-col items-center gap-3 py-8">
          <XCircle className="h-10 w-10 text-danger" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-brand-ink">
            {t('certificate.verify.notFound')}
          </h1>
        </Card>
      )}
    </div>
  )
}
