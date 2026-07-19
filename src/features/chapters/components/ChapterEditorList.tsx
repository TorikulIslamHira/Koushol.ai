import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
      <h2 className="font-display text-lg font-semibold">Chapters</h2>

      {chapters.length === 0 && <p className="text-sm text-black/60">No chapters yet.</p>}

      <ol className="flex flex-col gap-2">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2"
          >
            <Link
              to={`/teach/courses/${courseId}/chapters/${chapter.id}`}
              className="flex-1 text-sm hover:text-brand-green hover:underline"
            >
              {index + 1}. {chapter.title || '(untitled)'}
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0 || saving}
                onClick={() => moveChapter(chapters, chapter.id, 'up')}
                className="rounded px-2 py-1 text-sm disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === chapters.length - 1 || saving}
                onClick={() => moveChapter(chapters, chapter.id, 'down')}
                className="rounded px-2 py-1 text-sm disabled:opacity-30"
              >
                ↓
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
                className="rounded px-2 py-1 text-sm text-red-600 disabled:opacity-30"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="New chapter title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <Button type="button" onClick={handleAdd} disabled={saving || !newTitle.trim()}>
          Add chapter
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  )
}
