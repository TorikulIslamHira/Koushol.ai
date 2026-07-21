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
      {topics.map((topic) => {
        const isActive = topic.id === currentTopicId
        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelect(topic.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-left text-sm transition-colors duration-150',
              isActive
                ? 'border-brand-green bg-brand-green/10 font-medium text-brand-green'
                : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-brand-ink',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded font-display text-[10px] font-semibold',
                isActive ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              {topic.order_index + 1}
            </span>
            <span className="min-w-0 truncate">{topic.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
