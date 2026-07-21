import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import { useMyCertificates } from '@/features/certificates/hooks/useMyCertificates'
import { CertificateDownload } from '@/features/certificates/components/CertificateDownload'
import { AccountNav } from '@/features/account/components/AccountNav'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

/** Student's earned certificates ("/certificates"). */
export function CertificatesPage() {
  const { certificates, loading } = useMyCertificates()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <AccountNav />
      <h1 className="font-display text-3xl font-bold text-brand-ink">
        {t('certificatesPage.title')}
      </h1>

      {loading ? (
        <Spinner />
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title={t('certificatesPage.emptyState')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-brand-gold">
                <Award className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-400">
                  {t('certificate.verify.issuedOn', {
                    date: new Date(certificate.issued_at).toLocaleDateString(),
                  })}
                </span>
              </div>
              <Link
                to={`/courses/${certificate.course_id}`}
                className="font-display font-semibold text-brand-ink hover:text-brand-green"
              >
                {certificate.course.title}
              </Link>
              <CertificateDownload course={certificate.course} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
