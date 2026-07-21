import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-white hover:bg-brand-green-dark focus-visible:outline-brand-green',
  secondary:
    'bg-brand-gold text-brand-ink hover:bg-brand-gold-light focus-visible:outline-brand-gold',
  ghost: 'bg-transparent text-brand-green hover:bg-brand-green/10 focus-visible:outline-brand-green',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger',
}

/** Generic button styled with the Koushol brand palette. No business logic — safe to reuse anywhere. */
export function Button({ variant = 'primary', className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors duration-150 outline-offset-2 focus-visible:outline focus-visible:outline-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      disabled={disabled}
      {...rest}
    />
  )
}
