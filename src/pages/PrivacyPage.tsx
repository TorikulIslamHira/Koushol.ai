import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Privacy Policy ("/privacy"). DRAFT — describes what Koushol's code actually collects and
 * which third parties process it (verified against the real data model and Edge Functions,
 * not generic filler), but has not been reviewed by a lawyer. Update this in the same
 * commit whenever a new third-party processor is added — see PROJECT.md Section 2.
 */
export function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">Privacy Policy</h1>

      <Card className="flex items-start gap-3 border-brand-gold/30 bg-brand-gold/5">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-brand-gold"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <p className="text-sm text-slate-700">
          <strong>Draft, not legal advice.</strong> This describes what Koushol's code
          actually does today. It has not been reviewed by a lawyer and should be before
          it's relied on for real users, especially around Bangladesh-specific data
          protection requirements.
        </p>
      </Card>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-slate-700">
        <p className="text-xs text-slate-400">Last updated: 2026-07-19</p>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            What we collect
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Account info: name, email, and role (student/teacher/admin).</li>
            <li>
              Learning activity: enrollments, which chapters you've unlocked, and quiz scores.
            </li>
            <li>
              For teachers: course content you write, and raw notes you submit to the
              AI course-generation tool.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            Where it's stored and processed
          </h2>
          <p>
            Account data and course content are stored in Supabase (our database and
            authentication provider). Sign-in sessions are kept in your browser's local
            storage, not third-party tracking cookies.
          </p>
          <p className="mt-2">Two AI providers process specific content on request, not continuously:</p>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            <li>
              <strong>Groq</strong> — processes a teacher's raw notes when they use "Generate
              with AI" to draft chapters and quizzes.
            </li>
            <li>
              <strong>Sarvam AI</strong> — processes a chapter's text when a teacher generates
              audio narration for it.
            </li>
          </ul>
          <p className="mt-2">
            Fonts are loaded from Google Fonts, which — like any CDN — receives your IP address
            when your browser requests them.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            Payments
          </h2>
          <p>
            Not live yet. Once bKash/Nagad/SSLCommerz integration ships (Phase 6), this section
            will describe what payment data those providers receive — treat this page as
            incomplete on that topic until then.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            Access control
          </h2>
          <p>
            Your data is protected by database-level access rules (Row Level Security), not
            just app-level checks — students can only see their own progress, teachers can only
            see students enrolled in their own courses, and platform-wide access is limited to
            admins.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">
            Your choices
          </h2>
          <p>
            Contact the Koushol team to request a copy of your data or account deletion. Note
            that this is a manual process today — there's no self-service export/delete flow
            yet.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-brand-ink">Contact</h2>
          <p>Questions about this policy — contact the Koushol team directly.</p>
        </section>
      </div>
    </div>
  )
}
