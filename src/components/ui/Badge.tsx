import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'green' | 'gold' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-brand-green/10 text-brand-green',
  gold: 'bg-brand-gold/15 text-brand-gold',
  neutral: 'bg-black/5 text-black/60',
}

/** Small pill label for status/tags. No business logic — safe to reuse anywhere. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  )
}
