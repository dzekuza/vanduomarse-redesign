---
tags: [architecture, stable]
updated: 2026-11-01
---

# Tech Stack

Every dependency and **why it is here**. Update this note whenever a dependency is
added, removed, or majorly upgraded — and add a [[changelog]] entry.

## Core

| Package | Version | Why |
|---------|---------|-----|
| next | 16.4.2 | App Router site and admin |
| react / react-dom | 19.3.0 | UI runtime |
| typescript | ^5 | Strict typing |

## UI

| Package | Version | Why |
|---------|---------|-----|
| tailwindcss | ^4 | Styling, theme tokens in `globals.css` |
| shadcn (+ radix-ui, class-variance-authority, cn, tw-animate-css) | ^4.22.0 / ^1.8.1 | Admin UI primitives in `components/ui/` |
| @phosphor-icons/react | ^2.1.10 | Site and admin icons (thin/regular weights match the brand) |
| lucide-react | ^1.59.0 | Only inside generated shadcn primitives |
| sonner | ^2.0.8 | Admin toasts |
| next-themes | ^0.4.6 | Pulled in by the shadcn Toaster; site is light-only |

## Data & backend

| Package | Version | Why |
|---------|---------|-----|
| react-hook-form | ^7.90.0 | Admin forms |
| zod | ^4.6.7 | Form and (later) API validation |
| @hookform/resolvers | ^5.9.2 | Zod ↔ RHF bridge |
| @supabase/supabase-js | ^2.118.0 | Database client; typed with `lib/supabase/database.types.ts` |
| stripe | ^23.1.0 | Server-side Stripe client (`lib/stripe.ts`): hosted Checkout Sessions and webhook signature check for `/rezervacija` payments (ADR-0026) |
| @supabase/ssr | ^0.7.0 | Cookie-based auth session for Server Components, Server Actions and `proxy.ts` |
| server-only | ^0.0.1 | Build error if a server data module (`lib/data/public.ts`, `lib/admin/repository.ts`, `lib/supabase/server.ts`) is imported by client code |

Backend: Supabase (Postgres + Auth), see [[database]] and ADR-0007.

## Mobile (`mobile/` workspace, ADR-0083)

| Package | Version | Why |
|---------|---------|-----|
| expo / expo-router | ~58.0.25 / ~58.0.31 (React Native 0.88, React 19.3) | iOS staff admin app with file-based tab routing |
| react-native | 0.79.2 | Native iOS runtime |
| @react-native-async-storage/async-storage | 2.1.2 | Persists Supabase staff session and light/dark theme mode |
| expo-notifications / expo-device | ~58.1.9 / ~58.0.5 | Native iOS Push notifications for new bookings, inquiries and payments |
| lucide-react-native + react-native-svg | ^0.511.0 / 15.11.2 | Mobile tab and action icons |

## Tooling

| Package | Version | Why |
|---------|---------|-----|
| pnpm | 11 | Package manager (`packageManager` in `package.json`) |
| eslint + eslint-config-next | 9 / 16.4.2 | Lint, incl. React hooks/compiler rules |
| @tailwindcss/turbopack | 4 | Tailwind in the Turbopack dev server |
| fflate (dev) | ^0.8.3 | Zips the WordPress plugin in `scripts/build-wp-plugin.mts` (`pnpm build:wp-plugin`, run by `pnpm build`), ADR-0016 |

## Deliberately NOT used

| Package | Why not | Use instead |
|---------|---------|-------------|
| TanStack Query | Server Components + server actions cover the reads and writes | Add only if client-side refetching is needed |
| i18n library | Single language (LT) for now | Inline Lithuanian copy, constants for repeated strings |
| Geist font (shadcn default) | Off-brand | Termina (licensed, local files) via `font-sans` |
| Zustand / Redux | One admin store is enough | `useReducer` + context (`AdminStoreProvider`) |

## Related

[[system-overview]] · [[changelog]]

- `vaul` — swipeable drawer behind `components/ui/drawer.tsx` (home page activity drawer).
