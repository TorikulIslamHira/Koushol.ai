# Koushol Design System

Source of truth for visual identity. Do not introduce new colors, fonts, or spacing scales outside this doc without updating it in the same commit — see `PROJECT.md` Section 6.

Implemented as Tailwind v4 theme tokens in `src/styles/globals.css` (`@theme` block).

## Colors

| Token | Hex | Tailwind utility | Use |
|---|---|---|---|
| Brand green | `#0C8A4B` | `bg-brand-green`, `text-brand-green` | Primary actions, links, brand accents |
| Brand green (dark) | `#086437` | `bg-brand-green-dark` | Primary button hover state |
| Brand green (light) | `#12A85C` | `bg-brand-green-light` | Secondary accents, success states |
| Brand gold | `#D4A017` | `bg-brand-gold`, `text-brand-gold` | Secondary actions, price/highlight badges |
| Brand gold (light) | `#E6B93A` | `bg-brand-gold-light` | Secondary button hover state |
| Ink | `#0B1210` | `text-brand-ink` | Body/heading text on light backgrounds |

Neutral grays, background, and semantic colors (error/warning) use Tailwind's default palette (`black/N` opacity utilities, `red-600`, etc.) — no custom neutral scale yet. Add one here if a second designer/theme need arises.

## Typography

- **Display** (`font-display`, headings): [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — weights 500/600/700.
- **Body** (`font-body`, default): [Inter](https://fonts.google.com/specimen/Inter) — weights 400/500/600.

Both are loaded via Google Fonts `<link>` tags in `index.html`. If the app later needs to work fully offline, swap to self-hosted `@fontsource` packages instead — update this doc when you do.

## Components

Generic, brand-styled primitives live in `src/components/ui/`: `Button` (primary/secondary/ghost variants), `Card`, `Badge` (green/gold/neutral tones), `Spinner`, `ProgressBar`. Extend these rather than one-off styling a business component — see `PROJECT.md` Section 4 for the `ui/` vs `features/` split.

## Not yet decided

Certificate visual design is not decided — see `PROJECT.md` Section 10. Don't build certificate UI/PDF generation until this doc has a section for it.
