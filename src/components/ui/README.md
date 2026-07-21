# components/ui

Generic, business-logic-free UI primitives — anything here could be copy-pasted into a
different app unchanged. If a component needs to know anything about courses, modules,
students, or Koushol's data model, it belongs in `features/<domain>/components/` instead.

**Form/layout primitives**: `Button`, `Input` (also exports `Textarea`), `Select`, `Card`,
`Badge`, `Spinner`, `ProgressBar`, `StatTile`, `EmptyState`, `LanguageSwitcher`.

**Decorative/effect primitives** (added from a pasted reference, not yet restyled to
Koushol's dark-green/gold palette — a follow-up pass, not wired into any real page yet):
- `Highlighter` — hand-drawn-style text annotation (underline/highlight/circle/etc.), via
  the `rough-notation` package.
- `InteractiveGridPattern` — a grid of squares that light up under the cursor.
- `ModernLoginSignup` — a WebGL animated-dot-grid login/signup card (`three`). The email
  form and Google/GitHub/Apple buttons are decorative placeholders, not wired to Supabase
  auth — `features/auth/components/LoginForm.tsx`/`SignupForm.tsx` hold the real logic.
