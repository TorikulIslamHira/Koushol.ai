# Koushol Design System

Source of truth for visual identity. Do not introduce new colors, fonts, or spacing scales outside this doc without updating it in the same commit — see `PROJECT.md` Section 6.

Implemented as Tailwind v4 theme tokens in `src/styles/globals.css` (`@theme` block). Design decisions (palette expansion, style direction, typography pairing) are informed by the `ui-ux-pro-max` Claude skill (`.claude/skills/ui-ux-pro-max/`) — see that skill's `SKILL.md` for the underlying style/color/typography database.

**Style direction**: Swiss Modernism 2.0 (clean grid, mathematical spacing, high contrast, WCAG AAA-friendly) blended with Bento Box Grid patterns specifically for the three dashboards (student/teacher/admin all show cards of stats/courses). Deliberately *not* the playful/Claymorphism direction the skill's raw "education product" search first suggested — Koushol's dark-green/gold identity already reads as professional/trustworthy, not playful, and a redesign should sharpen that, not contradict it.

## Colors

| Token | Hex | Tailwind utility | Use |
|---|---|---|---|
| Brand green | `#0C8A4B` | `bg-brand-green`, `text-brand-green` | Primary actions, links, brand accents |
| Brand green (dark) | `#086437` | `bg-brand-green-dark` | Primary button hover state |
| Brand green (light) | `#12A85C` | `bg-brand-green-light` | Secondary accents |
| Brand gold | `#D4A017` | `bg-brand-gold`, `text-brand-gold` | Secondary actions, price/highlight/achievement badges |
| Brand gold (light) | `#E6B93A` | `bg-brand-gold-light` | Secondary button hover state |
| Ink | `#0B1210` | `text-brand-ink` | Body/heading text on light backgrounds |
| Danger | `#DC2626` (Tailwind `red-600`) | `text-danger`, `bg-danger` | Errors, destructive actions (delete, reject) |
| Danger (light bg) | `#FEF2F2` (Tailwind `red-50`) | `bg-danger-bg` | Error banner/toast background |

**Semantic mapping, not new hues**: "success" is `brand-green` (it already reads as positive/go), "pending/attention" is `brand-gold` (already used for the `pending_approval` course badge) — these are intentional reuses of the two brand colors rather than introducing a third and fourth accent hue. Only `danger` needed a genuinely new color, since red has no substitute in the existing palette and errors/destructive actions are common enough (delete course, reject submission, form validation) to deserve a formal token instead of the ad hoc `text-red-600` scattered through Phase 1-5 code.

**Neutral scale**: use Tailwind's built-in `slate-*` scale (`slate-50` through `slate-900`) for borders, secondary text, and surface backgrounds going forward, instead of `black/N` opacity utilities (e.g. `black/60`, `border-black/10`). Both render similarly at a glance, but a real scale gives consistent contrast ratios at each step (verified against the skill's 4.5:1 minimum) and matches the Swiss Modernism direction's "mathematical, clean" spacing/contrast principle. Phase 1-5 code still uses `black/N` in places — replace it opportunistically as each page gets redesigned, not as a giant unrelated find-replace commit.

## Typography

- **Display** (`font-display`, headings): [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — weights 500/600/700.
- **Body** (`font-body`, default): [Inter](https://fonts.google.com/specimen/Inter) — weights 400/500/600.
- **Bengali script fallback**: [Hind Siliguri](https://fonts.google.com/specimen/Hind+Siliguri) — weights 400/500/600/700, appended to *both* stacks above.

**Why Hind Siliguri matters and how it's wired in**: Space Grotesk and Inter are Latin-only typefaces — they have zero Bengali (Bangla script) glyph coverage. Before this fix, any Bangla text anywhere in the app (chapter content, course titles, quiz options — the seed data has plenty) was silently rendered in whatever Bengali font happened to be installed on the reader's OS, if any, with no design control over weight or style. Since CSS font-family fallback resolves *per glyph, not per element*, the fix isn't a separate "Bengali mode" — it's appending Hind Siliguri to the end of the existing `--font-display` and `--font-body` stacks. A heading like `<h1 class="font-display">নমস্কার Hello</h1>` renders "Hello" in Space Grotesk and "নমস্কার" in Hind Siliguri automatically, in the same element, no extra markup. The skill's typography database has no Bengali entries (checked directly — `data/typography.csv` has Korean/Hebrew/Thai multilingual pairings but not Bengali), so this pairing is a manual choice: Hind Siliguri is widely used in production Bangladeshi tech products, has excellent glyph coverage, and its proportions sit reasonably close to Inter's at body-text sizes.

All three families are loaded via Google Fonts `<link>` tags in `index.html`. If the app later needs to work fully offline, swap to self-hosted `@fontsource` packages instead — update this doc when you do.

## Components

Generic, brand-styled primitives live in `src/components/ui/`: `Button` (primary/secondary/ghost/danger variants), `Card`, `Badge` (green/gold/neutral/danger tones), `Spinner`, `ProgressBar`, `Input`, `Textarea`, `Select`, `EmptyState`, `StatTile`, `LanguageSwitcher`. Extend these rather than one-off styling a business component — see `PROJECT.md` Section 4 for the `ui/` vs `features/` split.

## Language

Full UI is bilingual (English/Bangla) via `react-i18next` — see `src/i18n/` and `PROJECT.md` Section 8 Phase 8. **Bangla is the default** for a first-time visitor (decided 2026-07-19); the choice persists in `localStorage` once a visitor toggles it via `LanguageSwitcher` in the nav. `<html lang>` is kept in sync with the active language (`src/app/App.tsx`).

When adding any new user-facing string: put it in both `src/i18n/locales/en.json` and `locales/bn.json` under a key namespaced by page/feature (e.g. `courses.emptyState`), and read it with `useTranslation()` — never hardcode English text directly in a component, even "temporarily." Backend/Supabase error messages (auth errors, RLS rejection text) are a known exception — they arrive in English from the API and are not yet mapped to translations; that's an intentionally separate follow-up, not an oversight.

## Not yet decided

Certificate visual design is not decided — see `PROJECT.md` Section 10. Don't build certificate UI/PDF generation until this doc has a section for it.
