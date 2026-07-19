import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Plain elevated container. No business logic — safe to reuse anywhere. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}
      {...rest}
    />
  )
}
