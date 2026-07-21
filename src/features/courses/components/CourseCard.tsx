import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBDT } from '@/lib/utils'
import type { CourseRow } from '@/types/database'

/** Summary tile for a course in the browse/catalog grid, linking to its detail page. */
export function CourseCard({ course }: { course: CourseRow }) {
  const { t } = useTranslation()

  return (
    <Link to={`/courses/${course.id}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 group-hover:border-brand-ink/30 group-hover:shadow-[4px_4px_0_0_rgba(11,18,16,0.08)]">
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-green to-brand-green-dark">
          <BookOpen
            className="h-8 w-8 text-white/80 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          {course.category && (
            <div>
              <Badge tone="neutral">{course.category}</Badge>
            </div>
          )}
          <h3 className="font-display text-lg font-semibold text-brand-ink transition-colors duration-150 group-hover:text-brand-green">
            {course.title}
          </h3>
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
            {course.description}
          </p>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-display font-semibold text-brand-ink">
              {formatBDT(course.price)}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-brand-green">
              {t('courses.viewCourse')}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
