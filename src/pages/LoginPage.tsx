import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { Card } from '@/components/ui/Card'

/** Sign-in page ("/login"). */
export function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold text-brand-ink">
        {t('auth.welcomeBack')}
      </h1>
      <p className="mb-6 text-sm text-slate-500">{t('auth.signInSubtitle')}</p>
      <Card>
        <LoginForm />
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-brand-green hover:underline">
          {t('nav.signUp')}
        </Link>
      </p>
    </div>
  )
}
