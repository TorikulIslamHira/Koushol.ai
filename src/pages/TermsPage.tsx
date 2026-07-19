import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Terms of Service ("/terms"). DRAFT — standard SaaS boilerplate written to match what
 * Koushol actually does today, not reviewed by a lawyer. Do not treat as final legal
 * protection; get it reviewed before relying on it with real paying users. See PROJECT.md
 * Section 10 handoff notes for the "not yet decided" list this belongs on.
 */
export function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">Terms of Service</h1>

      <Card className="flex items-start gap-3 border-brand-gold/30 bg-brand-gold/5">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-brand-gold"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <p className="text-sm text-slate-700">
          <strong>Draft, not legal advice.</strong> This is standard boilerplate written to
          match Koushol's current features. It has not been reviewed by a lawyer and should
          be reviewed by one before it's relied on for real users or payments.
        </p>
      </Card>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-slate-700">
        <p className="text-xs text-slate-400">Last updated: 2026-07-19</p>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            1. What Koushol is
          </h2>
          <p>
            Koushol is an online learning platform. Students browse courses, read chapters,
            take quizzes, and track progress. Teachers create and publish courses, which an
            administrator reviews before they go live to students.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            2. Accounts
          </h2>
          <p>
            You need an account to enroll in courses, track progress, or publish content. You're
            responsible for keeping your login credentials secure and for activity under your
            account. New accounts default to the student role — teacher and admin access is
            granted by an administrator, not self-service.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            3. Teacher-submitted content
          </h2>
          <p>
            Teachers are responsible for the accuracy and originality of the courses they
            submit, including any chapters generated with the AI course-creation tool. Koushol
            reviews submissions before publishing but does not independently verify factual
            accuracy. Don't upload content you don't have the rights to.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            4. Payments
          </h2>
          <p>
            Paid courses and payment processing (bKash, Nagad, SSLCommerz) are planned but not
            live yet. This section will be updated with real payment, refund, and cancellation
            terms before that ships — don't rely on it as final until then.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            5. Acceptable use
          </h2>
          <p>
            Don't use Koushol to harass others, upload unlawful content, attempt to bypass
            access controls, or interfere with the service. We can suspend accounts that
            violate this.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            6. Changes
          </h2>
          <p>
            We may update these terms as the product changes (see Section 4 above for a
            concrete example). Material changes will update the "last updated" date.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            7. Contact
          </h2>
          <p>Questions about these terms — contact the Koushol team directly.</p>
        </section>
      </div>
    </div>
  )
}
