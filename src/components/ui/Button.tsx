import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-white hover:bg-brand-green-dark',
  secondary: 'bg-brand-gold text-brand-ink hover:bg-brand-gold-light',
  ghost: 'bg-transparent text-brand-green hover:bg-brand-green/10',
}

/** Generic button styled with the Koushol brand palette. No business logic — safe to reuse anywhere. */
export function Button({ variant = 'primary', className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      disabled={disabled}
      {...rest}
    />
  )
}
