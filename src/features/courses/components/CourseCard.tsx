import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBDT } from '@/lib/utils'
import type { CourseRow } from '@/types/database'

/** Summary tile for a course in the browse/catalog grid, linking to its detail page. */
export function CourseCard({ course }: { course: CourseRow }) {
  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-brand-ink">{course.title}</h3>
          <Badge tone="gold">{formatBDT(course.price)}</Badge>
        </div>
        <p className="line-clamp-3 text-sm text-black/60">{course.description}</p>
      </Card>
    </Link>
  )
}
