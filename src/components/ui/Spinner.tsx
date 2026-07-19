import { cn } from '@/lib/utils'

/** Simple spin loader. No business logic — safe to reuse anywhere. */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'h-5 w-5 animate-spin rounded-full border-2 border-brand-green/20 border-t-brand-green',
        className,
      )}
    />
  )
}
