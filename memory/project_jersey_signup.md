---
name: Jersey Signup Project
description: Full-stack Next.js + Supabase jersey number signup app for a soccer team
type: project
---

Full-stack jersey number signup app for a soccer team.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v3, Supabase (Postgres + real-time), Vercel deployment.

**Key files:**
- `src/app/page.tsx` — main grid page (Server Component, fetches initial signups)
- `src/app/admin/page.tsx` — admin roster view at /admin
- `src/app/api/claim/route.ts` — POST endpoint to claim a jersey number
- `src/components/JerseyGrid.tsx` — Client Component with Supabase real-time subscription
- `src/components/SignupModal.tsx` — modal for entering name + size
- `src/lib/supabase.ts` — browser Supabase singleton + JerseySignup type
- `supabase/schema.sql` — full Postgres schema with RLS policies + realtime publication
- `.env.local.example` — env var template

**Features:**
- Numbers 1–30 grid: green = available, red = taken, blue = selected
- Real-time updates via `supabase_realtime` publication on `jersey_signups` table
- Unique constraint + 409 conflict response prevents double-booking
- If a number is taken while modal is open, it auto-closes with an error banner
- Admin page at /admin shows full roster table + available numbers grid

**DB table:** `jersey_signups` (id uuid PK, jersey_number int UNIQUE NOT NULL, player_name text, size text, created_at timestamptz)

**Why:** The coach wanted a simple self-serve tool for players to pick their jersey numbers.

**How to apply:** When making changes, keep the real-time deduplication logic (signup IDs compared) and the selectedRef pattern for the modal closure behavior.
