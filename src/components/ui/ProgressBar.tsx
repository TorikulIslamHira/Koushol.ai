import { cn } from '@/lib/utils'

/** Horizontal progress track, 0-100. No business logic — safe to reuse anywhere. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className="h-full rounded-full bg-brand-green transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
