---
tags: [architecture, wip]
updated: 2026-10-19
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

No backend yet: admin runs on an in-memory store (ADR-0005). Supabase planned.

## Tooling

| Package | Version | Why |
|---------|---------|-----|
| | | |

## Deliberately NOT used

| Package | Why not | Use instead |
|---------|---------|-------------|
| | | |

## Related

[[system-overview]] · [[changelog]]
