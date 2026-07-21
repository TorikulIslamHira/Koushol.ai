/** Joins class names, skipping falsy values — a minimal `clsx` for combining Tailwind classes conditionally. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Formats a BDT amount for display, e.g. 1200 -> "৳1,200". */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}

/** Initials for an avatar placeholder, e.g. "Anika Rahman" -> "AR". Falls back to "?" for an empty name. */
export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return initials || '?'
}
