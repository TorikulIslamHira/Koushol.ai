import type { TopicRow } from '@/types/database'

/** Renders a topic's title and plain-text content (line breaks preserved). No markdown/HTML parsing yet — content is stored as plain text. */
export function TopicReader({ topic }: { topic: TopicRow }) {
  return (
    <article>
      <h2 className="border-b border-slate-100 pb-4 font-display text-2xl font-bold text-brand-ink sm:text-3xl">
        {topic.title}
      </h2>
      <div className="mt-5 max-w-[68ch] text-[17px] whitespace-pre-line leading-[1.8] text-slate-700">
        {topic.content}
      </div>
    </article>
  )
}
