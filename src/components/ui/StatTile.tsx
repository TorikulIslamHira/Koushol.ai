import { Card } from '@/components/ui/Card'

/** A single number + label tile for dashboards (Bento-grid pattern). No business logic — safe to reuse anywhere. */
export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-brand-ink">{value}</p>
    </Card>
  )
}
