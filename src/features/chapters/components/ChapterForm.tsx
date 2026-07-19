import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { ChapterRow } from '@/types/database'

/** Edit form for a chapter's title and plain-text content. Order/deletion are handled by ChapterEditorList; the quiz is a separate editor (features/quizzes). */
export function ChapterForm({
  chapter,
  onSave,
  saving,
}: {
  chapter: ChapterRow
  onSave: (title: string, content: string) => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(title, content)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        {t('courseForm.title')}
        <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        {t('chapters.content')}
        <Textarea
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-mono text-sm"
        />
      </label>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t('teacher.saving') : t('chapters.saveChapter')}
      </Button>
    </form>
  )
}
