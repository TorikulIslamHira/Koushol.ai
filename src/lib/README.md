# lib/

Framework-agnostic utilities and singletons: the Supabase client (`supabase.ts`), cross-app constants like the quiz pass threshold (`constants.ts`), and small helpers (`utils.ts`).

Nothing here should import from `features/` or `pages/` — dependencies flow the other way.
