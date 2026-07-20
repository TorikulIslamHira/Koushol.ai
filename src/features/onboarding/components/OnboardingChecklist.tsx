import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useTeacherOnboardingStatus } from '@/features/onboarding/hooks/useTeacherOnboardingStatus'
import type { CourseRow } from '@/types/database'

const DISMISSED_KEY = 'koushol_teacher_checklist_dismissed'

/**
 * Teacher-facing "getting started" checklist on the teacher dashboard. State is derived
 * from real course/module/topic/quiz data (useTeacherOnboardingStatus), not a separate
 * progress table — the checklist just reflects what's already true. Auto-hides once every
 * step is done, or can be dismissed manually before that.
 */
export function OnboardingChecklist({ courses }: { courses: CourseRow[] }) {
  const { t } = useTranslation()
  const status = useTeacherOnboardingStatus(courses)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  if (dismissed || !status) return null

  const steps: { done: boolean; labelKey: string }[] = [
    { done: status.hasCourse, labelKey: 'onboarding.checklist.createCourse' },
    { done: status.hasModuleWithTopics, labelKey: 'onboarding.checklist.addModule' },
    { done: status.hasQuiz, labelKey: 'onboarding.checklist.saveQuiz' },
    { done: status.hasSubmitted, labelKey: 'onboarding.checklist.submit' },
  ]

  const allDone = steps.every((s) => s.done)
  if (allDone) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <Card className="relative flex flex-col gap-3">
      <button
        type="button"
        aria-label={t('onboarding.checklist.dismiss')}
        onClick={dismiss}
        className="absolute right-3 top-3 rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <h2 className="font-display text-lg font-semibold text-brand-ink">
        {t('onboarding.checklist.title')}
      </h2>
      <ul className="flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.labelKey} className="flex items-center gap-2 text-sm">
            {s.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
            )}
            <span className={cn(s.done && 'text-slate-400 line-through')}>{t(s.labelKey)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
