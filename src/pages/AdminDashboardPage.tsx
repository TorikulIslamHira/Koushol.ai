import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, BookOpen, GraduationCap, Wallet } from 'lucide-react'
import { useAdminStats } from '@/features/admin/hooks/useAdminStats'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/ui/StatTile'

/** Admin dashboard ("/admin") — platform-wide stats overview + links to user/course management. */
export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats()
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>
  if (!stats) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-brand-ink">{t('admin.title')}</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/admin/users" className="text-brand-green hover:underline">
            {t('admin.manageUsers')}
          </Link>
          <Link to="/admin/courses" className="text-brand-green hover:underline">
            {t('admin.reviewCourses')}
          </Link>
          <Link to="/admin/moderation" className="text-brand-green hover:underline">
            {t('admin.moderationTitle')} →
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
          {t('admin.users')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalUsers} />
          <StatTile label={t('admin.students')} value={stats.studentCount} />
          <StatTile label={t('admin.teachers')} value={stats.teacherCount} />
          <StatTile label={t('admin.admins')} value={stats.adminCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <BookOpen className="h-5 w-5 text-slate-400" aria-hidden="true" />
          {t('admin.courses')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalCourses} />
          <StatTile label={t('admin.draft')} value={stats.draftCount} />
          <StatTile label={t('admin.pendingReview')} value={stats.pendingApprovalCount} />
          <StatTile label={t('admin.published')} value={stats.publishedCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <GraduationCap className="h-5 w-5 text-slate-400" aria-hidden="true" />
          {t('admin.enrollments')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalEnrollments} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <Wallet className="h-5 w-5 text-slate-400" aria-hidden="true" />
          {t('admin.sales')}
        </h2>
        <Card>
          <p
            className="text-sm text-slate-500"
            dangerouslySetInnerHTML={{ __html: t('admin.salesNotLive') }}
          />
        </Card>
      </div>
    </div>
  )
}
