import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

/** App shell: top nav (brand + auth-aware links + language switcher) + footer (legal links), wrapping every route via <Outlet />. */
export function Layout() {
  const { session, profile, signOut } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-xl font-bold text-brand-green">
            Koushol
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/courses"
              className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
            >
              {t('nav.courses')}
            </Link>
            {session ? (
              <>
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                  <Link
                    to="/teach"
                    className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                  >
                    {t('nav.teach')}
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                {profile && <span className="text-slate-400">{profile.name}</span>}
                <Button variant="ghost" onClick={signOut}>
                  {t('nav.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                >
                  {t('nav.signIn')}
                </Link>
                <Link to="/signup">
                  <Button variant="secondary">{t('nav.signUp')}</Button>
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4">
            <Link to="/terms" className="transition-colors duration-150 hover:text-brand-green">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className="transition-colors duration-150 hover:text-brand-green">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
