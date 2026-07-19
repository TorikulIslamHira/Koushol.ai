import { Link } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, Wallet } from 'lucide-react'
import { useAdminStats } from '@/features/admin/hooks/useAdminStats'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/ui/StatTile'

/** Admin dashboard ("/admin") — platform-wide stats overview + links to user/course management. */
export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats()

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>
  if (!stats) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-brand-ink">Admin</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/admin/users" className="text-brand-green hover:underline">
            Manage users →
          </Link>
          <Link to="/admin/courses" className="text-brand-green hover:underline">
            Review courses →
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
          Users
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalUsers} />
          <StatTile label="Students" value={stats.studentCount} />
          <StatTile label="Teachers" value={stats.teacherCount} />
          <StatTile label="Admins" value={stats.adminCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <BookOpen className="h-5 w-5 text-slate-400" aria-hidden="true" />
          Courses
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalCourses} />
          <StatTile label="Draft" value={stats.draftCount} />
          <StatTile label="Pending review" value={stats.pendingApprovalCount} />
          <StatTile label="Published" value={stats.publishedCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <GraduationCap className="h-5 w-5 text-slate-400" aria-hidden="true" />
          Enrollments
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalEnrollments} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
          <Wallet className="h-5 w-5 text-slate-400" aria-hidden="true" />
          Sales
        </h2>
        <Card>
          <p className="text-sm text-slate-500">
            Payments aren't live yet — this fills in once Phase 6 (bKash/Nagad/SSLCommerz)
            ships. See <code>docs/decisions/cost-notes.md</code> and <code>PROJECT.md</code>{' '}
            Section 8.
          </p>
        </Card>
      </div>
    </div>
  )
}
