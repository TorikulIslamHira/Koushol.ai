import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Privacy Policy ("/privacy"). DRAFT — describes what Koushol's code actually collects and
 * which third parties process it (verified against the real data model and Edge Functions,
 * not generic filler), but has not been reviewed by a lawyer. Update this in the same
 * commit whenever a new third-party processor is added — see PROJECT.md Section 2.
 * Translated in both languages (src/i18n/locales/) — same "not legal advice" caveat applies
 * to both versions.
 */
export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <h1 className="font-display text-3xl font-bold text-brand-ink">{t('privacy.title')}</h1>

      <Card className="flex items-start gap-3 border-brand-gold/30 bg-brand-gold/5">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-brand-gold"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <p
          className="text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: t('privacy.draftBanner') }}
        />
      </Card>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-slate-700">
        <p className="text-xs text-slate-400">{t('privacy.lastUpdated')}</p>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.collect.title')}
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>{t('privacy.collect.account')}</li>
            <li>{t('privacy.collect.activity')}</li>
            <li>{t('privacy.collect.teacher')}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.storage.title')}
          </h2>
          <p>{t('privacy.storage.intro')}</p>
          <p className="mt-2">{t('privacy.storage.aiIntro')}</p>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('privacy.storage.groq') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privacy.storage.sarvam') }} />
          </ul>
          <p className="mt-2">{t('privacy.storage.fonts')}</p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.payments.title')}
          </h2>
          <p>{t('privacy.payments.body')}</p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.access.title')}
          </h2>
          <p>{t('privacy.access.body')}</p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.choices.title')}
          </h2>
          <p>{t('privacy.choices.body')}</p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            {t('privacy.contact.title')}
          </h2>
          <p>{t('privacy.contact.body')}</p>
        </section>
      </div>
    </div>
  )
}
