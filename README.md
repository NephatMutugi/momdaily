# MomDaily

A 2-minute daily companion for moms of kids 0–3 years. Daily tip + 3 habits, mobile-first web app.

**Status:** Phase 0 — bootstrap complete. See `MOMDAILY_BUILD_PROMPT.md` (one level up) for the full phased roadmap.

## Stack

Next.js 15 App Router · TypeScript · Prisma · Vercel Postgres · Tailwind. Phases 1+ add NextAuth, Resend, and the Anthropic SDK.

## Quick start

```bash
cp .env.example .env
# fill DATABASE_URL + DIRECT_URL from your Vercel Postgres dashboard
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## Project conventions (mirrors gym-planner)

- `src/app/` — App Router routes. Server components by default; `*Client.tsx` for interactivity.
- `src/components/` — shared UI (AppShell, BottomNav, etc.).
- `src/lib/` — shared utilities (Prisma client, auth, rate limiting, etc.).
- `src/data/` — static seed content (e.g., tip catalog in Phase 2).
- `prisma/schema.prisma` — database schema. Use `npm run db:push` for dev migrations.
- Route group `(auth)` for auth pages (added in Phase 1).

## See also

- `SETUP.md` — local development setup
- `DEPLOY.md` — Vercel deployment checklist
