import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useUpdateBio } from '@/features/verification/hooks/useUpdateBio'
import type { UserRow } from '@/types/database'

/** Lets a teacher edit the bio shown on their public profile page ("/teachers/:teacherId"). */
export function EditBioForm({ profile }: { profile: UserRow }) {
  const { t } = useTranslation()
  const { updateBio, saving, error } = useUpdateBio()
  const [bio, setBio] = useState(profile.bio ?? '')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    const ok = await updateBio(profile.id, bio)
    setSaved(ok)
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-brand-ink">{t('verification.editBio')}</h2>
      <p className="text-xs text-slate-500">{t('verification.editBioHint')}</p>
      <Textarea
        rows={3}
        value={bio}
        onChange={(e) => {
          setBio(e.target.value)
          setSaved(false)
        }}
        className="text-sm"
      />
      <Button type="button" onClick={handleSave} disabled={saving} className="self-start">
        {saving ? t('teacher.saving') : t('common.save')}
      </Button>
      {saved && !error && <p className="text-sm text-brand-green">{t('verification.bioSaved')}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  )
}
