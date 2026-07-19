import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Generic select dropdown, styled consistently with Input. No business logic — safe to reuse anywhere. */
export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'rounded-lg border border-slate-300 px-3 py-2 text-brand-ink transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-green focus-visible:border-brand-green',
        className,
      )}
      {...rest}
    />
  )
}
