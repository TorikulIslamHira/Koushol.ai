import { useAllUsers } from '@/features/admin/hooks/useAllUsers'
import { useUpdateUserRole } from '@/features/admin/hooks/useUpdateUserRole'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = ['student', 'teacher', 'admin']

/** Admin user management ("/admin/users") — list every user, change their role. The only path to becoming a teacher/admin, per PROJECT.md Section 3 (no self-service role escalation). */
export function AdminUsersPage() {
  const { users, loading, error, refetch } = useAllUsers()
  const { updateRole, saving } = useUpdateUserRole()
  const { session } = useAuth()

  if (loading) return <Spinner />
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">Users</h1>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <Card key={user.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-black/60">{user.email}</p>
            </div>
            <select
              value={user.role}
              disabled={saving || user.id === session?.user.id}
              onChange={async (e) => {
                const ok = await updateRole(user.id, e.target.value as UserRole)
                if (ok) refetch()
              }}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Card>
        ))}
      </div>
    </div>
  )
}
