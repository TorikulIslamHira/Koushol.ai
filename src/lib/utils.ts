/** Joins class names, skipping falsy values — a minimal `clsx` for combining Tailwind classes conditionally. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Formats a BDT amount for display, e.g. 1200 -> "৳1,200". */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}
