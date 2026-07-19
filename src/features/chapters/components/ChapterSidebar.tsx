import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ChapterRow } from '@/types/database'

/** Chapter nav list showing lock state relative to the student's unlocked_chapter_index. */
export function ChapterSidebar({
  courseId,
  chapters,
  currentChapterId,
  unlockedIndex,
}: {
  courseId: string
  chapters: ChapterRow[]
  currentChapterId: string
  unlockedIndex: number
}) {
  return (
    <nav className="flex flex-col gap-1">
      {chapters.map((chapter) => {
        const isLocked = chapter.order_index > unlockedIndex
        const isCurrent = chapter.id === currentChapterId
        const content = (
          <span className="flex items-center gap-2">
            <span className="text-xs text-black/40">{chapter.order_index + 1}.</span>
            {chapter.title}
            {isLocked && <span aria-hidden="true">🔒</span>}
          </span>
        )
        return isLocked ? (
          <span
            key={chapter.id}
            className="cursor-not-allowed rounded-lg px-3 py-2 text-sm text-black/40"
            aria-disabled="true"
          >
            {content}
          </span>
        ) : (
          <Link
            key={chapter.id}
            to={`/courses/${courseId}/chapters/${chapter.id}`}
            className={cn(
              'rounded-lg px-3 py-2 text-sm hover:bg-brand-green/10',
              isCurrent && 'bg-brand-green/10 font-medium text-brand-green',
            )}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
