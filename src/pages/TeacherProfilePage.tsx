import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTeacherBadge } from '@/features/verification/hooks/useTeacherBadge'
import { CourseCard } from '@/features/courses/components/CourseCard'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { getInitials } from '@/lib/utils'
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
    <div className="flex flex-col gap-8">
      <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-green font-display text-2xl font-bold text-white">
          {getInitials(badge.name)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-brand-green uppercase">
            {t('verification.instructor')}
          </p>
          <h1 className="mt-0.5 flex items-center gap-2 font-display text-3xl font-bold text-brand-ink">
            {badge.name}
            {badge.is_verified_teacher && (
              <span className="text-brand-green" title={t('verification.verifiedTeacher')}>
                <BadgeCheck className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
          </h1>
          {badge.bio && <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">{badge.bio}</p>}
        </div>
      </Card>

      <div>
        <div className="mb-4 flex items-baseline justify-between border-b border-slate-200 pb-3">
          <h2 className="font-display text-xl font-semibold text-brand-ink">
            {t('verification.publishedCourses')}
          </h2>
          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
            {t('courses.count', { count: courses.length })}
          </span>
        </div>
        {coursesLoading && <Spinner />}
        {!coursesLoading && courses.length === 0 && (
          <p className="text-sm text-slate-500">{t('verification.noPublishedCourses')}</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  )
}
