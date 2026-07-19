import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'

/** App shell: top nav (brand + auth-aware links) wrapping every route via <Outlet />. */
export function Layout() {
  const { session, profile, signOut } = useAuth()

  return (
    <div className="min-h-screen">
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
              Courses
            </Link>
            {session ? (
              <>
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                  <Link
                    to="/teach"
                    className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                  >
                    Teach
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                  >
                    Admin
                  </Link>
                )}
                {profile && <span className="text-slate-400">{profile.name}</span>}
                <Button variant="ghost" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 transition-colors duration-150 hover:text-brand-green"
                >
                  Sign in
                </Link>
                <Link to="/signup">
                  <Button variant="secondary">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
