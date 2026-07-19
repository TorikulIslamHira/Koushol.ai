import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { Card } from '@/components/ui/Card'

/** Sign-up page ("/signup"). */
export function SignupPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold text-brand-ink">
        {t('auth.createAccount')}
      </h1>
      <p className="mb-6 text-sm text-slate-500">{t('auth.createAccountSubtitle')}</p>
      <Card>
        <SignupForm />
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to="/login" className="text-brand-green hover:underline">
          {t('nav.signIn')}
        </Link>
      </p>
    </div>
  )
}
