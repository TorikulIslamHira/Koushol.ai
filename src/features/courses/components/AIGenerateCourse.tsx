import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useGenerateCourse, type GeneratedChapter } from '@/features/courses/hooks/useGenerateCourse'
import { useApplyGeneratedChapters } from '@/features/courses/hooks/useApplyGeneratedChapters'
import { useCourseMutations } from '@/features/courses/hooks/useCourseMutations'

/**
 * "Generate with AI" panel on the course editor: teacher pastes raw notes, reviews the
 * proposed chapters/quizzes (Groq output, not yet saved), then either adds them all or
 * discards. Per-chapter edits happen afterward on the normal chapter/quiz editors — this
 * panel intentionally doesn't support inline editing of the proposal (keeps the review
 * step simple; revisit if teachers want to tweak before committing).
 */
export function AIGenerateCourse({
  courseId,
  initialNotes,
  existingChapterCount,
  onApplied,
}: {
  courseId: string
  initialNotes: string
  existingChapterCount: number
  onApplied: () => void
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [proposal, setProposal] = useState<GeneratedChapter[] | null>(null)
  const { generate, generating, error: generateError } = useGenerateCourse()
  const { updateCourse } = useCourseMutations()
  const { apply, applying, error: applyError } = useApplyGeneratedChapters(
    courseId,
    existingChapterCount,
    () => {
      setProposal(null)
      onApplied()
    },
  )

  async function handleGenerate() {
    await updateCourse(courseId, { raw_notes: notes })
    const chapters = await generate(courseId, notes)
    if (chapters) setProposal(chapters)
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Generate with AI</h2>
      <p className="text-xs text-black/50">
        Paste your raw topic notes below. AI will propose chapters and quizzes appended
        after your existing chapters — review before adding.
      </p>

      <textarea
        rows={8}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste your raw notes here…"
        className="rounded-lg border border-black/10 px-3 py-2 text-sm"
      />

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !notes.trim()}
        className="self-start"
      >
        {generating ? 'Generating…' : 'Generate chapters'}
      </Button>
      {generateError && <p className="text-sm text-red-600">{generateError}</p>}

      {proposal && (
        <div className="flex flex-col gap-4 border-t border-black/10 pt-4">
          <h3 className="font-medium">Proposed chapters ({proposal.length})</h3>
          {proposal.map((chapter, i) => (
            <div key={i} className="rounded-lg border border-black/10 p-3 text-sm">
              <p className="font-medium">
                {existingChapterCount + i + 1}. {chapter.title}
              </p>
              <p className="mt-1 whitespace-pre-line text-black/60">{chapter.content}</p>
              <p className="mt-2 text-xs text-black/40">{chapter.questions.length} quiz question(s)</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" disabled={applying} onClick={() => apply(proposal)}>
              {applying ? 'Adding…' : `Add ${proposal.length} chapter(s) to course`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setProposal(null)}>
              Discard
            </Button>
          </div>
          {applyError && <p className="text-sm text-red-600">{applyError}</p>}
        </div>
      )}
    </Card>
  )
}
