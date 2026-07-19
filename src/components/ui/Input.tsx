import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const fieldClasses =
  'rounded-lg border border-slate-300 px-3 py-2 text-brand-ink placeholder:text-slate-400 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green focus-visible:border-brand-green'

/** Generic text input, styled consistently across forms. No business logic — safe to reuse anywhere. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...rest} />
}

/** Generic textarea, same styling as Input. No business logic — safe to reuse anywhere. */
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, className)} {...rest} />
}
