import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
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
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(title, content)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Content
        <textarea
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 font-mono text-sm"
        />
      </label>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? 'Saving…' : 'Save chapter'}
      </Button>
    </form>
  )
}
