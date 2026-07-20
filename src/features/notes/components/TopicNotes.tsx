import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NotebookPen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useTopicNote } from '@/features/notes/hooks/useTopicNote'

/** Private note-taking panel for the current topic, shown to enrolled students only. Autosaves nothing — explicit save, same pattern as reviews/bio elsewhere in this app. */
export function TopicNotes({ topicId }: { topicId: string }) {
  const { t } = useTranslation()
  const { note, loading, saving, saveNote } = useTopicNote(topicId)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setContent(note?.content ?? '')
  }, [note])

  if (loading) return null

  return (
    <Card className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-brand-ink">
        <NotebookPen className="h-4 w-4 text-brand-green" aria-hidden="true" />
        {t('notes.heading')}
      </h3>
      <Textarea
        rows={4}
        placeholder={t('notes.placeholder')}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setSaved(false)
        }}
        className="text-sm"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={async () => {
            const ok = await saveNote(content)
            setSaved(ok)
          }}
          className="self-start"
        >
          {saving ? t('notes.saving') : t('notes.save')}
        </Button>
        {saved && <span className="text-xs text-brand-green">{t('notes.saved')}</span>}
      </div>
    </Card>
  )
}
