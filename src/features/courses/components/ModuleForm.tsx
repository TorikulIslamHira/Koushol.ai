import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { ModuleRow } from '@/types/database'

/** Edit form for a module's title. Topics and the quiz are separate editors (features/chapters, features/quizzes). */
export function ModuleForm({
  module,
  onSave,
  saving,
}: {
  module: ModuleRow
  onSave: (title: string) => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(module.title)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(title)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        {t('courseForm.title')}
        <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t('teacher.saving') : t('common.save')}
      </Button>
    </form>
  )
}
