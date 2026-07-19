# features/auth/

Sign-in/sign-up forms, the `useAuth` hook + `AuthContext` type (the provider itself lives in `src/app/providers/AuthProvider.tsx` since it wraps the whole app), and two route guards: `RequireAuth` (signed-in) and `RequireTeacher` (signed-in + role teacher/admin, for the `/teach` pages).

Both guards are UX convenience only — the real access control is Supabase RLS (see `supabase/migrations/`). Never treat a passing client-side check as a security boundary.
