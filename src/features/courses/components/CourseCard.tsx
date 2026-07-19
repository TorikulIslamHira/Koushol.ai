import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBDT } from '@/lib/utils'
import type { CourseRow } from '@/types/database'

/** Summary tile for a course in the browse/catalog grid, linking to its detail page. */
export function CourseCard({ course }: { course: CourseRow }) {
  return (
    <Link to={`/courses/${course.id}`} className="group block">
      <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 transition-shadow duration-150 group-hover:shadow-md">
        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-green to-brand-green-dark">
          <BookOpen className="h-8 w-8 text-white/80" aria-hidden="true" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-brand-ink">{course.title}</h3>
            <Badge tone="gold">{formatBDT(course.price)}</Badge>
          </div>
          <p className="line-clamp-3 text-sm text-slate-600">{course.description}</p>
        </div>
      </Card>
    </Link>
  )
}
