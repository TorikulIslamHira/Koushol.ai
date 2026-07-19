import { Link } from 'react-router-dom'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { Card } from '@/components/ui/Card'

/** Sign-up page ("/signup"). */
export function SignupPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold text-brand-ink">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-slate-500">Free to browse, free to start learning.</p>
      <Card>
        <SignupForm />
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
