# components/ui

Generic, business-logic-free UI primitives — anything here could be copy-pasted into a
different app unchanged. If a component needs to know anything about courses, modules,
students, or Koushol's data model, it belongs in `features/<domain>/components/` instead.

**Form/layout primitives**: `Button`, `Input` (also exports `Textarea`), `Select`, `Card`,
`Badge`, `Spinner`, `ProgressBar`, `StatTile`, `EmptyState`, `LanguageSwitcher`.

**Decorative/effect primitives** (themed to Koushol's brand-green/brand-gold palette,
see `src/styles/globals.css`'s `@theme` block):
- `Highlighter` — hand-drawn-style text annotation (underline/highlight/circle/etc.), via
  the `rough-notation` package. Default color is brand-gold at low opacity. Used on
  `HomePage`'s hero heading.
- `InteractiveGridPattern` — a grid of squares that light up under the cursor. Not yet
  wired into a real page.
- `ModernLoginSignup` — a WebGL animated-dot-grid card (`three`), dot colors tinted brand
  green/gold. Handles real email/password sign-in and sign-up via `useAuth` (no OAuth in
  this app, so the original reference design's Google/GitHub/Apple buttons were dropped
  rather than kept as non-functional decoration). Used by `pages/LoginPage.tsx` and
  `pages/SignupPage.tsx`, which replaced the old `LoginForm`/`SignupForm` components
  (deleted — this component now owns that form logic directly).
