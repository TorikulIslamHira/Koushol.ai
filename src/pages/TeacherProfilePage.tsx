import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTeacherBadge } from '@/features/verification/hooks/useTeacherBadge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatBDT } from '@/lib/utils'
import type { CourseRow } from '@/types/database'

/** Public teacher profile page ("/teachers/:teacherId") — name, bio, verified badge, and their published courses. */
export function TeacherProfilePage() {
  const { teacherId } = useParams<{ teacherId: string }>()
  const { t } = useTranslation()
  const { badge, loading: badgeLoading } = useTeacherBadge(teacherId)
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!teacherId) {
      setCoursesLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        setCourses((data as CourseRow[]) ?? [])
        setCoursesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [teacherId])

  if (badgeLoading) return <Spinner />
  if (!badge) return <p className="text-slate-500">{t('verification.teacherNotFound')}</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-brand-ink">
          {badge.name}
          {badge.is_verified_teacher && (
            <span className="text-brand-green" title={t('verification.verifiedTeacher')}>
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </h1>
        {badge.bio && <p className="mt-2 max-w-2xl text-slate-600">{badge.bio}</p>}
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-brand-ink">
          {t('verification.publishedCourses')}
        </h2>
        {coursesLoading && <Spinner />}
        {!coursesLoading && courses.length === 0 && (
          <p className="text-sm text-slate-500">{t('verification.noPublishedCourses')}</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`} className="group block">
              <Card className="flex h-full flex-col gap-2 transition-shadow duration-150 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 font-display font-semibold text-brand-ink">
                    <BookOpen className="h-4 w-4 text-brand-green" aria-hidden="true" />
                    {course.title}
                  </h3>
                  <Badge tone="gold">{formatBDT(course.price)}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{course.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
