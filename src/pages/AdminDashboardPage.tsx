import { Link } from 'react-router-dom'
import { useAdminStats } from '@/features/admin/hooks/useAdminStats'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-black/60">{label}</p>
      <p className="font-display text-3xl font-semibold text-brand-ink">{value}</p>
    </Card>
  )
}

/** Admin dashboard ("/admin") — platform-wide stats overview + links to user/course management. */
export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats()

  if (loading) return <Spinner />
  if (error) return <p className="text-red-600">{error}</p>
  if (!stats) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
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
        <h2 className="mb-2 font-display text-lg font-semibold">Users</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalUsers} />
          <StatTile label="Students" value={stats.studentCount} />
          <StatTile label="Teachers" value={stats.teacherCount} />
          <StatTile label="Admins" value={stats.adminCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">Courses</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalCourses} />
          <StatTile label="Draft" value={stats.draftCount} />
          <StatTile label="Pending review" value={stats.pendingApprovalCount} />
          <StatTile label="Published" value={stats.publishedCount} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">Enrollments</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={stats.totalEnrollments} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">Sales</h2>
        <Card>
          <p className="text-sm text-black/60">
            Payments aren't live yet — this fills in once Phase 6 (bKash/Nagad/SSLCommerz)
            ships. See <code>docs/decisions/cost-notes.md</code> and{' '}
            <code>PROJECT.md</code> Section 8.
          </p>
        </Card>
      </div>
    </div>
  )
}
