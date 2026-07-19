import { cn } from '@/lib/utils'
import type { TopicRow } from '@/types/database'

/** Topic switcher within a module — every topic in an unlocked module is freely readable, so there's no lock state here, just a nav list picking which topic's content shows in the main pane. */
export function TopicTabs({
  topics,
  currentTopicId,
  onSelect,
}: {
  topics: TopicRow[]
  currentTopicId: string
  onSelect: (topicId: string) => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onSelect(topic.id)}
          className={cn(
            'rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-brand-green/10',
            topic.id === currentTopicId && 'bg-brand-green/10 font-medium text-brand-green',
          )}
        >
          <span className="text-xs text-slate-400">{topic.order_index + 1}.</span> {topic.title}
        </button>
      ))}
    </nav>
  )
}
