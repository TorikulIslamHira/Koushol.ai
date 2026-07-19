import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { QUIZ_PASS_THRESHOLD } from '@/lib/constants'
import type { QuizRow } from '@/types/database'

/** Renders a chapter's quiz questions, grades the attempt client-side against QUIZ_PASS_THRESHOLD, and reports the result via onSubmit. */
export function QuizPlayer({
  quiz,
  onSubmit,
  submitting,
}: {
  quiz: QuizRow
  onSubmit: (scorePercent: number, passed: boolean) => void
  submitting: boolean
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<{ scorePercent: number; passed: boolean } | null>(null)

  const allAnswered = quiz.questions.every((_, i) => answers[i] !== undefined)

  function handleSubmit() {
    const correctCount = quiz.questions.reduce(
      (count, q, i) => count + (answers[i] === q.correct_index ? 1 : 0),
      0,
    )
    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100)
    const passed = scorePercent >= QUIZ_PASS_THRESHOLD
    setResult({ scorePercent, passed })
    onSubmit(scorePercent, passed)
  }

  return (
    <div className="flex flex-col gap-6">
      {quiz.questions.map((question, qIndex) => (
        <fieldset key={qIndex} className="flex flex-col gap-2">
          <legend className="font-medium text-brand-ink">{question.question}</legend>
          {question.options.map((option, oIndex) => (
            <label
              key={oIndex}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm',
                answers[qIndex] === oIndex && 'border-brand-green bg-brand-green/5',
              )}
            >
              <input
                type="radio"
                name={`question-${qIndex}`}
                checked={answers[qIndex] === oIndex}
                onChange={() => setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ))}

      {result ? (
        <p className={cn('font-medium', result.passed ? 'text-brand-green' : 'text-red-600')}>
          {result.passed
            ? `Passed with ${result.scorePercent}%! Next chapter unlocked.`
            : `Scored ${result.scorePercent}% — need ${QUIZ_PASS_THRESHOLD}% to pass. Try again.`}
        </p>
      ) : (
        <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
          {submitting ? 'Submitting…' : 'Submit quiz'}
        </Button>
      )}
      {result && !result.passed && (
        <Button
          variant="ghost"
          onClick={() => {
            setAnswers({})
            setResult(null)
          }}
        >
          Retake quiz
        </Button>
      )}
    </div>
  )
}
