import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCertificate } from '@/features/certificates/hooks/useCertificate'
import type { CourseRow } from '@/types/database'

/**
 * Renders a one-page certificate PDF client-side and triggers a browser download. jsPDF is
 * dynamically imported here rather than at module load — it pulls in html2canvas/dompurify
 * (~400KB) for its HTML-rendering path, which nothing here uses, so eagerly importing it
 * would bloat every course-detail page load for the rare student who's actually finished.
 */
async function downloadCertificatePdf(
  courseTitle: string,
  studentName: string,
  certificateId: string,
  issuedAt: string,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  const centerX = width / 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('Certificate of Completion', centerX, 110, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.text('This certifies that', centerX, 160, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(studentName, centerX, 195, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.text('has successfully completed the course', centerX, 225, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(courseTitle, centerX, 255, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const issuedDate = new Date(issuedAt).toLocaleDateString()
  doc.text(`Issued ${issuedDate} · Koushol`, centerX, 310, { align: 'center' })
  doc.text(`Verify: ${window.location.origin}/verify/${certificateId}`, centerX, 328, { align: 'center' })

  doc.save(`${courseTitle} - Certificate.pdf`)
}

/** Shown on the course detail page once a student has finished every module — issues the certificate (if not already) and offers the PDF download. */
export function CertificateDownload({ course }: { course: CourseRow }) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { certificate, loading, issuing, issue } = useCertificate(course.id)

  useEffect(() => {
    if (!loading && !certificate) {
      issue()
    }
  }, [loading, certificate, issue])

  if (loading || issuing || !certificate) return null

  return (
    <Button
      type="button"
      variant="secondary"
      className="gap-1.5"
      onClick={() =>
        void downloadCertificatePdf(
          course.title,
          profile?.name ?? '',
          certificate.id,
          certificate.issued_at,
        )
      }
    >
      <Award className="h-4 w-4" aria-hidden="true" />
      {t('certificate.download')}
    </Button>
  )
}
