# Local Setup

## Prerequisites

- Node 20+
- A Vercel account (free tier is fine)
- A Vercel Postgres database (provisioned via the Vercel dashboard — Neon-backed)

## 1. Clone & install

```bash
git clone <your-repo-url> momdaily
cd momdaily
npm install
```

`postinstall` runs `prisma generate` automatically.

## 2. Environment variables

```bash
cp .env.example .env
```

Fill in from your Vercel Postgres dashboard:

- `DATABASE_URL` — the pooled connection string (used at runtime).
- `DIRECT_URL` — the unpooled connection string (used by Prisma for migrations).

The other env vars get filled in later phases — leave them empty for Phase 0.

## 3. Initialize the database

```bash
npm run db:push
```

This applies `prisma/schema.prisma` to your database without creating a migration history file. Once we're past Phase 0 and the schema stabilizes, we'll switch to `prisma migrate`.

## 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000. You should see the MomDaily placeholder home.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply schema to DB (no migration file) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (browse DB) |
