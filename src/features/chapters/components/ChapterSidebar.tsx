import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
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
            <span className="text-xs text-slate-400">{chapter.order_index + 1}.</span>
            {chapter.title}
            {isLocked && <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          </span>
        )
        return isLocked ? (
          <span
            key={chapter.id}
            className="cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400"
            aria-disabled="true"
          >
            {content}
          </span>
        ) : (
          <Link
            key={chapter.id}
            to={`/courses/${courseId}/chapters/${chapter.id}`}
            className={cn(
              'rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors duration-150 hover:bg-brand-green/10',
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
