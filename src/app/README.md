# app/

App shell: the root `App.tsx` (router + provider wiring), the top-level `Layout.tsx` (nav bar + `<Outlet />`), and `providers/` for app-wide React context providers (currently just `AuthProvider`).

Does **not** belong here: route-level page content (goes in `pages/`), or anything reusable outside this app (goes in `components/ui/`).
