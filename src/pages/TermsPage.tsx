import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const SECTION_KEYS = ['what', 'accounts', 'content', 'payments', 'use', 'changes', 'contact'] as const

/**
 * Terms of Service ("/terms"). DRAFT — standard SaaS boilerplate written to match what
 * Koushol actually does today, not reviewed by a lawyer. Do not treat as final legal
 * protection; get it reviewed before relying on it with real paying users. See PROJECT.md
 * Section 10 handoff notes for the "not yet decided" list this belongs on. Translated in
 * both languages (src/i18n/locales/) — translation is not a substitute for legal review
 * either, if anything it's one more reason a lawyer should check both versions.
 */
export function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">{t('terms.title')}</h1>

      <Card className="flex items-start gap-3 border-brand-gold/30 bg-brand-gold/5">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-brand-gold"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <p
          className="text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: t('terms.draftBanner') }}
        />
      </Card>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-slate-700">
        <p className="text-xs text-slate-400">{t('terms.lastUpdated')}</p>

        {SECTION_KEYS.map((key) => (
          <section key={key}>
            <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
              {t(`terms.sections.${key}.title`)}
            </h2>
            <p>{t(`terms.sections.${key}.body`)}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
