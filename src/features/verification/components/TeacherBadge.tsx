import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import { useTeacherBadge } from '@/features/verification/hooks/useTeacherBadge'

/** Shows a teacher's name (linking to their public profile) with a verified badge if they've been marked as such by an admin. */
export function TeacherBadge({ teacherId }: { teacherId: string }) {
  const { t } = useTranslation()
  const { badge, loading } = useTeacherBadge(teacherId)

  if (loading || !badge) return null

  return (
    <p className="flex items-center gap-1.5 text-sm text-slate-500">
      <span>{t('verification.instructor')}:</span>
      <Link to={`/teachers/${teacherId}`} className="text-brand-green hover:underline">
        {badge.name}
      </Link>
      {badge.is_verified_teacher && (
        <span className="flex items-center gap-1 text-brand-green" title={t('verification.verifiedTeacher')}>
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </p>
  )
}
