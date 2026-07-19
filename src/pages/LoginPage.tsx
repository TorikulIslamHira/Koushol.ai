import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { Card } from '@/components/ui/Card'

/** Sign-in page ("/login"). */
export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold text-brand-ink">Welcome back</h1>
      <p className="mb-6 text-sm text-slate-500">Sign in to continue learning.</p>
      <Card>
        <LoginForm />
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        No account?{' '}
        <Link to="/signup" className="text-brand-green hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
