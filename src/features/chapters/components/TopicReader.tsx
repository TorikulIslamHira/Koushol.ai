import type { TopicRow } from '@/types/database'

/** Renders a topic's title and plain-text content (line breaks preserved). No markdown/HTML parsing yet — content is stored as plain text. */
export function TopicReader({ topic }: { topic: TopicRow }) {
  return (
    <article>
      <h2 className="font-display text-2xl font-semibold text-brand-ink">{topic.title}</h2>
      <div className="mt-4 max-w-[68ch] whitespace-pre-line leading-[1.7] text-slate-700">
        {topic.content}
      </div>
    </article>
  )
}
