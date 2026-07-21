import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

/** Top-nav link with the active-section underline (Swiss-style: color + 2px border, no pill). */
function TopNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          '-mb-px border-b-2 pb-0.5 transition-colors duration-150',
          isActive
            ? 'border-brand-green font-medium text-brand-green'
            : 'border-transparent text-slate-600 hover:text-brand-green',
        )
      }
    >
      {children}
    </NavLink>
  )
}

/** App shell: top nav (brand + auth-aware links + language switcher) + footer (brand blurb + legal links), wrapping every route via <Outlet />. */
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
            {session && <TopNavLink to="/dashboard">{t('nav.dashboard')}</TopNavLink>}
            <TopNavLink to="/courses">{t('nav.courses')}</TopNavLink>
            {session ? (
              <>
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                  <TopNavLink to="/teach">{t('nav.teach')}</TopNavLink>
                )}
                {profile?.role === 'admin' && <TopNavLink to="/admin">{t('nav.admin')}</TopNavLink>}
                {profile && <span className="hidden text-slate-400 sm:inline">{profile.name}</span>}
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
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div className="max-w-xs">
              <p className="font-display text-lg font-bold text-brand-green">Koushol</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('footer.tagline')}</p>
            </div>
            <nav className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link to="/courses" className="transition-colors duration-150 hover:text-brand-green">
                {t('nav.courses')}
              </Link>
              <Link to="/terms" className="transition-colors duration-150 hover:text-brand-green">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="transition-colors duration-150 hover:text-brand-green">
                {t('footer.privacy')}
              </Link>
            </nav>
          </div>
          <p className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-400">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  )
}
