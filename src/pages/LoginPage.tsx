import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { Card } from '@/components/ui/Card'

/** Sign-in page ("/login"). */
export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Sign in</h1>
      <Card>
        <LoginForm />
      </Card>
      <p className="mt-4 text-sm text-black/60">
        No account?{' '}
        <Link to="/signup" className="text-brand-green hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
