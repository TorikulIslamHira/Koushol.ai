import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SEEN_KEY = 'koushol_student_tour_seen'
const STEP_KEYS = ['browse', 'enroll', 'quiz', 'progress'] as const

/**
 * One-time modal walkthrough shown on a student's first dashboard visit. A centered modal
 * sequence rather than DOM-anchored tooltips — no new dependency needed for four static
 * steps, and it doesn't need to track element positions across pages.
 */
export function OnboardingTour() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(SEEN_KEY) === '1')
  const [step, setStep] = useState(0)

  if (dismissed) return null

  function finish() {
    localStorage.setItem(SEEN_KEY, '1')
    setDismissed(true)
  }

  const isLast = step === STEP_KEYS.length - 1
  const stepKey = STEP_KEYS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="relative flex w-full max-w-sm flex-col gap-4">
        <button
          type="button"
          aria-label={t('onboarding.tour.skip')}
          onClick={finish}
          className="absolute right-3 top-3 rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div>
          <p className="text-xs font-medium text-brand-green">
            {t('onboarding.tour.stepCount', { current: step + 1, total: STEP_KEYS.length })}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-brand-ink">
            {t(`onboarding.tour.${stepKey}.title`)}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t(`onboarding.tour.${stepKey}.description`)}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={finish}>
            {t('onboarding.tour.skip')}
          </Button>
          <Button type="button" onClick={() => (isLast ? finish() : setStep((s) => s + 1))}>
            {isLast ? t('onboarding.tour.getStarted') : t('onboarding.tour.next')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
