import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Standard page heading block: optional uppercase overline, display-size title, optional
 * subtitle, optional right-aligned actions. Keeps title hierarchy identical across pages
 * (Swiss-modernist scale — see docs/design-system.md). No business logic — safe to reuse anywhere.
 */
export function PageHeader({
  overline,
  title,
  subtitle,
  actions,
  className,
}: {
  overline?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {overline && (
          <p className="mb-1 text-xs font-semibold tracking-wider text-brand-green uppercase">
            {overline}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold text-brand-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
