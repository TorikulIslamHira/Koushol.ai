import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useChapterMutations } from '@/features/chapters/hooks/useChapterMutations'
import type { ChapterRow } from '@/types/database'

/** Teacher-facing chapter list on the course editor page: reorder, delete, and add new chapters. Editing a chapter's content/quiz happens on its own page (features/chapters + features/quizzes editors). */
export function ChapterEditorList({
  courseId,
  chapters,
  onChanged,
}: {
  courseId: string
  chapters: ChapterRow[]
  onChanged: () => void
}) {
  const { createChapter, deleteChapter, moveChapter, saving, error } = useChapterMutations(
    courseId,
    onChanged,
  )
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd() {
    if (!newTitle.trim()) return
    const ok = await createChapter(newTitle.trim(), '', chapters.length)
    if (ok) setNewTitle('')
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-brand-ink">Chapters</h2>

      {chapters.length === 0 && <p className="text-sm text-slate-500">No chapters yet.</p>}

      <ol className="flex flex-col gap-2">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
          >
            <Link
              to={`/teach/courses/${courseId}/chapters/${chapter.id}`}
              className="flex-1 text-sm text-slate-700 transition-colors duration-150 hover:text-brand-green hover:underline"
            >
              {index + 1}. {chapter.title || '(untitled)'}
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0 || saving}
                onClick={() => moveChapter(chapters, chapter.id, 'up')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === chapters.length - 1 || saving}
                onClick={() => moveChapter(chapters, chapter.id, 'down')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Delete chapter"
                disabled={saving}
                onClick={() => {
                  if (confirm(`Delete "${chapter.title}"? This also removes its quiz.`)) {
                    deleteChapter(
                      chapter.id,
                      chapters.filter((c) => c.id !== chapter.id),
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
          placeholder="New chapter title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button type="button" onClick={handleAdd} disabled={saving || !newTitle.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add chapter
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  )
}
