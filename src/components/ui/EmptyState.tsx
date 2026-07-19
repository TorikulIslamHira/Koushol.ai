import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Consistent "nothing here yet" placeholder — icon, message, optional action. No business logic — safe to reuse anywhere. */
export function EmptyState({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center',
        className,
      )}
    >
      <Icon className="h-8 w-8 text-slate-400" aria-hidden="true" />
      <p className="text-slate-500">{title}</p>
      {action}
    </div>
  )
}
