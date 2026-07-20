import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import { useAllUsers } from '@/features/admin/hooks/useAllUsers'
import { useUpdateUserRole } from '@/features/admin/hooks/useUpdateUserRole'
import { useUpdateVerifiedTeacher } from '@/features/admin/hooks/useUpdateVerifiedTeacher'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = ['student', 'teacher', 'admin']
const ROLE_BADGE_TONE: Record<UserRole, 'neutral' | 'green' | 'gold'> = {
  student: 'neutral',
  teacher: 'green',
  admin: 'gold',
}

/** Admin user management ("/admin/users") — list every user, change their role. The only path to becoming a teacher/admin, per PROJECT.md Section 3 (no self-service role escalation). */
export function AdminUsersPage() {
  const { users, loading, error, refetch } = useAllUsers()
  const { updateRole, saving } = useUpdateUserRole()
  const { updateVerifiedTeacher, saving: savingVerified } = useUpdateVerifiedTeacher()
  const { session } = useAuth()
  const { t } = useTranslation()

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">{t('admin.usersTitle')}</h1>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <Card key={user.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-brand-ink">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <Badge tone={ROLE_BADGE_TONE[user.role]}>{t(`roles.${user.role}`)}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {user.role === 'teacher' && (
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={user.is_verified_teacher}
                    disabled={savingVerified}
                    onChange={async (e) => {
                      const ok = await updateVerifiedTeacher(user.id, e.target.checked)
                      if (ok) refetch()
                    }}
                  />
                  <BadgeCheck className="h-4 w-4 text-brand-green" aria-hidden="true" />
                  {t('verification.verifiedTeacher')}
                </label>
              )}
              <Select
                value={user.role}
                disabled={saving || user.id === session?.user.id}
                onChange={async (e) => {
                  const ok = await updateRole(user.id, e.target.value as UserRole)
                  if (ok) refetch()
                }}
                className="text-sm"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
