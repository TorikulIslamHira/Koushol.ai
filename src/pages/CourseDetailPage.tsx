import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Lock, CheckCircle2, Star, Layers, Tag, Award } from 'lucide-react'
import { useCourse } from '@/features/courses/hooks/useCourse'
import { useEnrollment } from '@/features/enrollment/hooks/useEnrollment'
import { EnrollButton } from '@/features/enrollment/components/EnrollButton'
import { CertificateDownload } from '@/features/certificates/components/CertificateDownload'
import { TeacherBadge } from '@/features/verification/components/TeacherBadge'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { ReviewList } from '@/features/reviews/components/ReviewList'
import { useCourseReviews } from '@/features/reviews/hooks/useCourseReviews'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBDT } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** Injects a schema.org Course JSON-LD block into <head> for the lifetime of this page — no react-helmet dependency needed for one script tag. */
function useCourseStructuredData(course: { title: string; description: string; price: number } | null) {
  useEffect(() => {
    if (!course) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description,
      provider: { '@type': 'Organization', name: 'Koushol', url: 'https://koushol.xyz' },
      offers: { '@type': 'Offer', price: course.price, priceCurrency: 'BDT' },
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [course])
}

/** One row in the sticky course-overview sidebar: icon square + label/value pair. */
function OverviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-brand-ink">
        <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="truncate text-sm font-semibold text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

/** Course detail page ("/courses/:courseId") — hero, module list + reviews, sticky overview sidebar. */
export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { course, modules, loading, error } = useCourse(courseId)
  const { enrollment } = useEnrollment(courseId)
  const { session } = useAuth()
  const { reviews, averageRating, refetch: refetchReviews } = useCourseReviews(courseId)
  const unlockedIndex = enrollment?.unlocked_module_index ?? 0
  const { t } = useTranslation()

  useCourseStructuredData(course)

  if (loading) return <Spinner />
  if (error) return <p className="text-danger">{error}</p>
  if (!course) return <p className="text-slate-500">{t('courses.courseNotFound')}</p>

  const myReview = reviews.find((r) => r.student_id === session?.user.id) ?? null
  const isFinished = !!enrollment && modules.length > 0 && unlockedIndex >= modules.length

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="flex flex-wrap gap-2">
            {course.category && <Badge tone="neutral">{course.category}</Badge>}
            {modules.length > 0 && (
              <Badge tone="green">{t('courses.freePreview')}</Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-brand-ink sm:text-4xl">
            {course.title}
          </h1>
          <TeacherBadge teacherId={course.teacher_id} />
          <p className="max-w-2xl leading-relaxed text-slate-600">{course.description}</p>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <span className="font-display text-2xl font-bold text-brand-ink">
              {formatBDT(course.price)}
            </span>
            {averageRating !== null && (
              <>
                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Star
                    className="h-4 w-4 fill-brand-gold text-brand-gold"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-brand-ink">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">
                    {t('courseDetail.reviewCount', { count: reviews.length })}
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <EnrollButton course={course} modules={modules} />
            {isFinished && <CertificateDownload course={course} />}
          </div>
        </div>

        <div className="hidden h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark lg:flex">
          <BookOpen className="h-12 w-12 text-white/80" aria-hidden="true" strokeWidth={1.25} />
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card className="p-6">
            <div className="mb-4 flex items-baseline justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-semibold text-brand-ink">
                {t('modules.heading')}
              </h2>
              <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                {t('courseDetail.moduleCount', { count: modules.length })}
              </span>
            </div>
            <ol>
              {modules.map((module) => {
                const isLocked = module.order_index > unlockedIndex
                const isCompleted = module.order_index < unlockedIndex
                const number = String(module.order_index + 1).padStart(2, '0')
                const row = (
                  <div className="flex items-center gap-4 py-3.5">
                    <span
                      className={
                        isCompleted
                          ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 font-display text-xs font-semibold text-brand-green'
                          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-display text-xs font-semibold text-brand-ink'
                      }
                    >
                      {number}
                    </span>
                    <span
                      className={
                        isLocked
                          ? 'flex-1 text-sm text-slate-400'
                          : 'flex-1 text-sm font-medium text-brand-ink transition-colors duration-150 group-hover:text-brand-green'
                      }
                    >
                      {module.title}
                    </span>
                    {module.order_index === 0 && <Badge tone="green">{t('courses.freePreview')}</Badge>}
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" aria-hidden="true" />
                    )}
                    {isLocked && <Lock className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
                  </div>
                )
                return (
                  <li key={module.id} className="border-b border-slate-100 last:border-0">
                    {isLocked ? (
                      row
                    ) : (
                      <Link
                        to={`/courses/${course.id}/modules/${module.id}`}
                        className="group block"
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="font-display text-xl font-semibold text-brand-ink">
              {t('reviews.heading')}
            </h2>
            <ReviewList reviews={reviews} averageRating={averageRating} />
            {enrollment && (
              <div className="border-t border-slate-100 pt-4">
                <ReviewForm courseId={course.id} existing={myReview} onSaved={refetchReviews} />
              </div>
            )}
          </Card>
        </div>

        <Card className="flex flex-col gap-5 p-6 lg:sticky lg:top-20 lg:col-span-4">
          <h3 className="border-b border-slate-100 pb-3 text-xs font-bold tracking-wider text-brand-ink uppercase">
            {t('courseDetail.overview')}
          </h3>
          <OverviewRow
            icon={Layers}
            label={t('modules.heading')}
            value={t('courseDetail.moduleCount', { count: modules.length })}
          />
          {course.category && (
            <OverviewRow icon={Tag} label={t('courseDetail.categoryLabel')} value={course.category} />
          )}
          <OverviewRow
            icon={Award}
            label={t('courseDetail.certificateLabel')}
            value={t('courseDetail.certificateIncluded')}
          />
        </Card>
      </div>
    </div>
  )
}
