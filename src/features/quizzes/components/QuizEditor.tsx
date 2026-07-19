import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { QuizQuestion } from '@/types/database'

const emptyQuestion = (): QuizQuestion => ({ question: '', options: ['', ''], correct_index: 0 })

/** Teacher-facing editor for a chapter's quiz questions — add/remove questions and options, mark the correct one per question. */
export function QuizEditor({
  initialQuestions,
  onSave,
  saving,
}: {
  initialQuestions: QuizQuestion[]
  onSave: (questions: QuizQuestion[]) => void
  saving: boolean
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : [],
  )

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q,
      ),
    )
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q)),
    )
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = q.options.filter((_, j) => j !== oIndex)
        const correct_index = q.correct_index >= options.length ? 0 : q.correct_index
        return { ...q, options, correct_index }
      }),
    )
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const canSave = questions.every(
    (q) => q.question.trim() && q.options.length >= 2 && q.options.every((o) => o.trim()),
  )

  return (
    <div className="flex flex-col gap-6">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
          <div className="flex items-start gap-2">
            <input
              type="text"
              placeholder="Question"
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
              className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              className="rounded px-2 py-1 text-sm text-red-600"
            >
              Remove
            </button>
          </div>
          {q.options.map((option, oIndex) => (
            <label key={oIndex} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`correct-${qIndex}`}
                checked={q.correct_index === oIndex}
                onChange={() => updateQuestion(qIndex, { correct_index: oIndex })}
              />
              <input
                type="text"
                placeholder={`Option ${oIndex + 1}`}
                value={option}
                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                className="flex-1 rounded-lg border border-black/10 px-2 py-1"
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(qIndex, oIndex)}
                  className="text-xs text-red-600"
                >
                  ✕
                </button>
              )}
            </label>
          ))}
          <button
            type="button"
            onClick={() => addOption(qIndex)}
            className="self-start text-xs text-brand-green hover:underline"
          >
            + Add option
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
        className="self-start text-sm text-brand-green hover:underline"
      >
        + Add question
      </button>

      <Button
        type="button"
        onClick={() => onSave(questions)}
        disabled={saving || !canSave}
        className="self-start"
      >
        {saving ? 'Saving…' : 'Save quiz'}
      </Button>
    </div>
  )
}
