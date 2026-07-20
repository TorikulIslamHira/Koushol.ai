# features/onboarding

First-run guidance for new users — no new database tables, everything here either reads
existing data or stores a plain dismissal flag in `localStorage`.

- `components/OnboardingTour.tsx` — one-time modal walkthrough shown on a student's first
  `/dashboard` visit (browse → enroll → quiz → progress). Dismissal is tracked via the
  `koushol_student_tour_seen` localStorage key.
- `components/OnboardingChecklist.tsx` — "getting started" checklist on the teacher
  dashboard (`/teach`). Step completion is derived live from the teacher's actual courses/
  modules/topics/quizzes via `useTeacherOnboardingStatus`, not a stored progress table —
  the checklist just reflects what's already true. Auto-hides once every step is done, or
  can be dismissed early via the `koushol_teacher_checklist_dismissed` localStorage key.
- `hooks/useTeacherOnboardingStatus.ts` — the derivation logic above.
