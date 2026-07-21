import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpenCheck, Sparkles, Volume2, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Highlighter } from '@/components/ui/Highlighter'
import { InteractiveGridPattern } from '@/components/ui/InteractiveGridPattern'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { CourseCard } from '@/features/courses/components/CourseCard'

const STEP_KEYS = ['read', 'quiz', 'unlock'] as const

// Bento layout: two uneven tiles on top (one dark accent tile), two even tiles below.
const FEATURE_LAYOUT = [
  { key: 'aiCourse', icon: Sparkles, span: 'md:col-span-8', dark: false },
  { key: 'teachers', icon: GraduationCap, span: 'md:col-span-4', dark: true },
  { key: 'audio', icon: Volume2, span: 'md:col-span-6', dark: false },
  { key: 'sequential', icon: BookOpenCheck, span: 'md:col-span-6', dark: false },
] as const

const FEATURED_COURSE_COUNT = 3

/** Landing page ("/") — hero, how-it-works, bento feature grid, featured courses, closing CTA. */
export function HomePage() {
  const { t } = useTranslation()
  const { courses } = useCourses()
  const featuredCourses = courses.slice(0, FEATURED_COURSE_COUNT)

  return (
    <div className="flex flex-col gap-20 py-12">
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-medium text-brand-green">
            {t('home.badge')}
          </span>
          <h1 className="font-display text-4xl font-bold text-brand-ink sm:text-5xl">
            {t('home.heading1')}{' '}
            <Highlighter action="highlight" color="rgba(212, 160, 23, 0.35)">
              <span className="text-brand-green">{t('home.headingHighlight')}</span>
            </Highlighter>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">{t('home.subheading')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/courses">
              <Button className="gap-2">
                {t('home.browseCourses')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost">{t('home.howItWorks')}</Button>
            </a>
          </div>
        </div>

        <div className="relative hidden aspect-square overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-brand-green/5 to-brand-gold/5 lg:block">
          <InteractiveGridPattern
            className="opacity-40"
            squaresClassName="hover:fill-brand-green/20"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <GraduationCap className="h-24 w-24 text-brand-green/30" strokeWidth={1} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="how-it-works">
        <h2 className="font-display text-2xl font-semibold text-brand-ink">
          {t('home.howItWorks')}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEP_KEYS.map((key, index) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="font-display text-3xl font-bold text-brand-green/30">
                {index + 1}
              </span>
              <h3 className="font-display font-semibold text-brand-ink">
                {t(`home.steps.${key}.title`)}
              </h3>
              <p className="text-sm text-slate-600">{t(`home.steps.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-brand-ink">
          {t('home.whatMakesDifferent')}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[180px]">
          {FEATURE_LAYOUT.map(({ key, icon: Icon, span, dark }) => (
            <Card
              key={key}
              className={
                dark
                  ? `flex flex-col justify-center gap-3 border-transparent bg-brand-ink text-white ${span}`
                  : `flex gap-4 ${span}`
              }
            >
              <Icon
                className={dark ? 'h-6 w-6 shrink-0 text-brand-gold' : 'h-6 w-6 shrink-0 text-brand-green'}
                aria-hidden="true"
                strokeWidth={1.75}
              />
              <div>
                <h3 className={dark ? 'font-display font-semibold text-white' : 'font-display font-semibold text-brand-ink'}>
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className={dark ? 'mt-1 text-sm text-white/70' : 'mt-1 text-sm text-slate-600'}>
                  {t(`home.features.${key}.description`)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {featuredCourses.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-brand-ink">
                {t('home.featured.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{t('home.featured.subtitle')}</p>
            </div>
            <Link
              to="/courses"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-green hover:text-brand-green-dark sm:flex"
            >
              {t('home.browseCourses')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl bg-brand-green px-8 py-10 text-center text-white">
        <h2 className="font-display text-2xl font-semibold">{t('home.ctaTitle')}</h2>
        <p className="mt-2 text-white/90">{t('home.ctaSubtitle')}</p>
        <Link to="/courses" className="mt-6 inline-block">
          <Button variant="secondary">{t('home.browseCourses')}</Button>
        </Link>
      </section>
    </div>
  )
}
