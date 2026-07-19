import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { CourseInput } from '@/features/courses/hooks/useCourseMutations'
import type { CourseRow } from '@/types/database'

/** Create/edit form for a course's title, description, and price. Publish/unpublish and chapters are handled separately on the course editor page. */
export function CourseForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = 'Save',
}: {
  initial?: CourseRow
  onSubmit: (input: CourseInput) => void
  submitting: boolean
  submitLabel?: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(String(initial?.price ?? 0))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ title, description, price: Number(price) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Title
        <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Description
        <Textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Price (৳)
        <Input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
