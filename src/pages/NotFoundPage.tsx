import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Catch-all 404 page for any unmatched route. */
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-8xl font-bold text-brand-green/15" aria-hidden="true">
        404
      </p>
      <Compass className="h-10 w-10 text-brand-green/40" aria-hidden="true" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-bold text-brand-ink">{t('notFoundPage.title')}</h1>
      <p className="max-w-sm text-slate-500">{t('notFoundPage.description')}</p>
      <Link to="/">
        <Button>{t('common.backToHome')}</Button>
      </Link>
    </div>
  )
}
