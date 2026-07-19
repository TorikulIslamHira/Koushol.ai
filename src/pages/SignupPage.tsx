import { Link } from 'react-router-dom'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { Card } from '@/components/ui/Card'

/** Sign-up page ("/signup"). */
export function SignupPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Create your account</h1>
      <Card>
        <SignupForm />
      </Card>
      <p className="mt-4 text-sm text-black/60">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
