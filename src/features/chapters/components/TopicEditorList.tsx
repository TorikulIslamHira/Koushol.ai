import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTopicMutations } from '@/features/chapters/hooks/useTopicMutations'
import type { TopicRow } from '@/types/database'

/** Teacher-facing topic list on the module editor page: reorder, delete, and add new topics. Editing a topic's content happens on its own page. */
export function TopicEditorList({
  courseId,
  moduleId,
  topics,
  onChanged,
}: {
  courseId: string
  moduleId: string
  topics: TopicRow[]
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const { createTopic, deleteTopic, moveTopic, saving, error } = useTopicMutations(
    moduleId,
    onChanged,
  )
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd() {
    if (!newTitle.trim()) return
    const ok = await createTopic(newTitle.trim(), '', topics.length)
    if (ok) setNewTitle('')
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-brand-ink">{t('topics.heading')}</h2>

      {topics.length === 0 && <p className="text-sm text-slate-500">{t('topics.noTopicsYet')}</p>}

      <ol className="flex flex-col gap-2">
        {topics.map((topic, index) => (
          <li
            key={topic.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
          >
            <Link
              to={`/teach/courses/${courseId}/modules/${moduleId}/topics/${topic.id}`}
              className="flex-1 text-sm text-slate-700 transition-colors duration-150 hover:text-brand-green hover:underline"
            >
              {index + 1}. {topic.title || t('topics.untitled')}
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t('topics.moveUp')}
                disabled={index === 0 || saving}
                onClick={() => moveTopic(topics, topic.id, 'up')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('topics.moveDown')}
                disabled={index === topics.length - 1 || saving}
                onClick={() => moveTopic(topics, topic.id, 'down')}
                className="rounded p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('topics.deleteTopic')}
                disabled={saving}
                onClick={() => {
                  if (confirm(t('topics.deleteTopicConfirm', { title: topic.title }))) {
                    deleteTopic(
                      topic.id,
                      topics.filter((tp) => tp.id !== topic.id),
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
          placeholder={t('topics.newTopicPlaceholder')}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={saving || !newTitle.trim()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('topics.addTopic')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  )
}
