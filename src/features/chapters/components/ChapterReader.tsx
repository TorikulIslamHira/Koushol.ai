import type { ChapterRow } from '@/types/database'

/** Renders a chapter's title and plain-text content (line breaks preserved). No markdown/HTML parsing yet — content is stored as plain text. */
export function ChapterReader({ chapter }: { chapter: ChapterRow }) {
  return (
    <article>
      <h2 className="font-display text-2xl font-semibold text-brand-ink">{chapter.title}</h2>
      <div className="mt-4 max-w-[68ch] whitespace-pre-line leading-[1.7] text-slate-700">
        {chapter.content}
      </div>
    </article>
  )
}
