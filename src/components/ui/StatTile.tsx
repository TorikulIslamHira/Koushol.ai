import { Card } from '@/components/ui/Card'

/** A single number + label tile for dashboards (Bento-grid pattern). No business logic — safe to reuse anywhere. */
export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-display text-3xl font-semibold text-brand-ink">{value}</p>
    </Card>
  )
}
