# Koushol

Interactive learning platform — see [`PROJECT.md`](./PROJECT.md) for the full spec, architecture, and engineering rules. Read that file (and `docs/design-system.md`, `docs/data-model.md`) before making changes.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Supabase (Postgres/Auth), React Router.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

### Database

Apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI: `supabase db push`, or `supabase db reset` for a fresh local instance). `supabase/seed.sql` seeds two sample courses for local development only — never run it against a production project.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) and production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build locally
