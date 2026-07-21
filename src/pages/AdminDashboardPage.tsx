import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, BookOpen, GraduationCap, Wallet, ArrowRight } from 'lucide-react'
import { useAdminStats } from '@/features/admin/hooks/useAdminStats'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/ui/StatTile'
import { PageHeader } from '@/components/ui/PageHeader'

/** Section heading inside the admin dashboard: icon + title with the divider treatment. */
function SectionHeading({ icon: Icon, children }: { icon: typeof Users; children: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 font-display text-lg font-semibold text-brand-ink">
      <Icon className="h-5 w-5 text-brand-green" aria-hidden="true" strokeWidth={1.75} />
      {children}
    </h2>
  )
}

/** Admin dashboard ("/admin") — platform-wide stats overview + links to user/course management. */
export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats()
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>
  if (!stats) return null

  const quickLinks = [
    { to: '/admin/users', label: t('admin.manageUsers') },
    { to: '/admin/courses', label: t('admin.reviewCourses') },
    { to: '/admin/moderation', label: t('admin.moderationTitle') },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader overline={t('nav.admin')} title={t('admin.title')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map(({ to, label }) => (
          <Link key={to} to={to} className="group">
            <Card className="flex items-center justify-between gap-2 py-4 group-hover:border-brand-ink/30 group-hover:shadow-[4px_4px_0_0_rgba(11,18,16,0.08)]">
              <span className="text-sm font-medium text-brand-ink transition-colors duration-150 group-hover:text-brand-green">
                {label.replace(/\s*→\s*$/, '')}
              </span>
              <ArrowRight
                className="h-4 w-4 text-brand-green transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <SectionHeading icon={Users}>{t('admin.users')}</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalUsers} />
          <StatTile label={t('admin.students')} value={stats.studentCount} />
          <StatTile label={t('admin.teachers')} value={stats.teacherCount} />
          <StatTile label={t('admin.admins')} value={stats.adminCount} />
        </div>
      </div>

      <div>
        <SectionHeading icon={BookOpen}>{t('admin.courses')}</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalCourses} />
          <StatTile label={t('admin.draft')} value={stats.draftCount} />
          <StatTile label={t('admin.pendingReview')} value={stats.pendingApprovalCount} />
          <StatTile label={t('admin.published')} value={stats.publishedCount} />
        </div>
      </div>

      <div>
        <SectionHeading icon={GraduationCap}>{t('admin.enrollments')}</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('admin.total')} value={stats.totalEnrollments} />
        </div>
      </div>

      <div>
        <SectionHeading icon={Wallet}>{t('admin.sales')}</SectionHeading>
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
