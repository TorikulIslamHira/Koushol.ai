import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StickyNote } from 'lucide-react'
import { useMyNotes } from '@/features/notes/hooks/useMyNotes'
import { AccountNav } from '@/features/account/components/AccountNav'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

/** Student's saved notes across every topic ("/notes"). */
export function NotesPage() {
  const { notes, loading } = useMyNotes()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <AccountNav />
      <h1 className="font-display text-xl font-semibold text-brand-ink">{t('notesPage.title')}</h1>

      {loading ? (
        <Spinner />
      ) : notes.length === 0 ? (
        <EmptyState icon={StickyNote} title={t('notesPage.emptyState')} />
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to={`/courses/${note.topic.module.course_id}/modules/${note.topic.module_id}?topic=${note.topic.id}`}
                  className="font-display font-semibold text-brand-ink hover:text-brand-green"
                >
                  {note.topic.title}
                </Link>
                <span className="text-xs text-slate-400">
                  {note.topic.module.course.title} · {note.topic.module.title}
                </span>
              </div>
              <p className="line-clamp-3 text-sm text-slate-600">{note.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
