import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/** Email/password/name sign-up form. New accounts default to the student role (see supabase/migrations/20260719010000_create_users.sql). */
export function SignupForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password, name)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/courses')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Name
        <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Email
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
        Password
        <Input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
