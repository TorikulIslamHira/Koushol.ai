import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpenCheck, Sparkles, Volume2, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Highlighter } from '@/components/ui/Highlighter'

const STEP_KEYS = ['read', 'quiz', 'unlock'] as const
const FEATURE_ICONS = {
  aiCourse: Sparkles,
  audio: Volume2,
  sequential: BookOpenCheck,
  teachers: GraduationCap,
} as const

/** Landing page ("/") — hero, how-it-works, feature highlights, closing CTA. */
export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-20 py-12">
      <section className="flex flex-col items-start gap-6">
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
        <Link to="/courses">
          <Button className="gap-2">
            {t('home.browseCourses')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </section>

      <section>
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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(FEATURE_ICONS) as (keyof typeof FEATURE_ICONS)[]).map((key) => {
            const Icon = FEATURE_ICONS[key]
            return (
              <Card key={key} className="flex gap-4">
                <Icon
                  className="h-6 w-6 shrink-0 text-brand-green"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <div>
                  <h3 className="font-display font-semibold text-brand-ink">
                    {t(`home.features.${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(`home.features.${key}.description`)}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

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
