import { ModernLoginSignup } from '@/components/ui/ModernLoginSignup'

/** Sign-in page ("/login"). */
export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <ModernLoginSignup mode="login" />
    </div>
  )
}
