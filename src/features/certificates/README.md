# features/certificates

Certificate issuance and PDF download for students who finish every module of a course.

- `hooks/useCertificate.ts` — reads/issues the current student's certificate for a course.
  Issuance is a plain insert; the real gate is the `certificates_insert_own` RLS policy (see
  `supabase/migrations/20260721000000_certificate_issuance.sql`), which only allows it once
  `enrollments.unlocked_module_index` covers every module of that course.
- `components/CertificateDownload.tsx` — shown on `CourseDetailPage` once a course is fully
  unlocked. Issues the certificate if one doesn't exist yet, then generates a one-page PDF
  client-side (`jspdf`) and triggers a browser download — no server round-trip.

The public verification page (`src/pages/VerifyCertificatePage.tsx`, `/verify/:certificateId`)
lives outside this folder since it's a page, not a feature component, but it calls the same
migration's `verify_certificate` RPC — a security-definer function so an anonymous visitor can
look up one certificate by id without a blanket read grant on the whole table.
