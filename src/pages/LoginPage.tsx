import { ModernLoginSignup } from '@/components/ui/ModernLoginSignup'

/** Sign-in page ("/login"). */
export function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-4">
      <ModernLoginSignup mode="login" />
    </div>
  )
}
