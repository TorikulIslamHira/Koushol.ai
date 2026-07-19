import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useModuleMutations } from '@/features/courses/hooks/useModuleMutations'
import type { ModuleRow } from '@/types/database'

/** Teacher-facing module list on the course editor page: reorder, delete, and add new modules. Editing a module's topics/quiz happens on its own page. */
export function ModuleEditorList({
  courseId,
  modules,
  onChanged,
}: {
  courseId: string
  modules: ModuleRow[]
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const { createModule, deleteModule, moveModule, saving, error } = useModuleMutations(
    courseId,
    onChanged,
  )
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd() {
    if (!newTitle.trim()) return
    const ok = await createModule(newTitle.trim(), modules.length)
    if (ok) setNewTitle('')
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-brand-ink">
        {t('modules.heading')}
      </h2>

      {modules.length === 0 && (
        <p className="text-sm text-slate-500">{t('modules.noModulesYet')}</p>
      )}

      <ol className="flex flex-col gap-2">
        {modules.map((module, index) => (
          <li
            key={module.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
          >
            <Link
              to={`/teach/courses/${courseId}/modules/${module.id}`}
              className="flex-1 text-sm text-slate-700 transition-colors duration-150 hover:text-brand-green hover:underline"
            >
              {index + 1}. {module.title || t('modules.untitled')}
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t('modules.moveUp')}
                disabled={index === 0 || saving}
                onClick={() => moveModule(modules, module.id, 'up')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('modules.moveDown')}
                disabled={index === modules.length - 1 || saving}
                onClick={() => moveModule(modules, module.id, 'down')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('modules.deleteModule')}
                disabled={saving}
                onClick={() => {
                  if (confirm(t('modules.deleteModuleConfirm', { title: module.title }))) {
                    deleteModule(
                      module.id,
                      modules.filter((m) => m.id !== module.id),
                    )
                  }
                }}
                className="rounded p-1.5 text-danger transition-colors duration-150 hover:bg-danger-bg disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={t('modules.newModulePlaceholder')}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={saving || !newTitle.trim()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('modules.addModule')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  )
}
