# Deploying to Vercel

## One-time setup

### 1. Create the Vercel project

- Push the repo to GitHub.
- In Vercel: **Add New → Project → Import** the GitHub repo.
- Framework preset: **Next.js** (auto-detected).
- Build command: leave default — `package.json` already overrides it with `vercel-build` (`prisma generate && next build`).
- Output directory: leave default.

### 2. Provision Vercel Postgres

- In the Vercel project, go to **Storage → Create Database → Postgres** (powered by Neon).
- Connect it to the project. Vercel will inject `POSTGRES_*` and `DATABASE_URL` env vars automatically.
- Add two env vars manually so they match Prisma's expected names:
  - `DATABASE_URL` → the pooled connection string (Vercel sometimes names this `POSTGRES_PRISMA_URL`)
  - `DIRECT_URL` → the unpooled connection string (Vercel sometimes names this `POSTGRES_URL_NON_POOLING`)

Sanity check: `DATABASE_URL` should contain `?pgbouncer=true&connect_timeout=...` or end with `-pooler`.

### 3. Push the initial schema

The first deploy will run `prisma generate` during `vercel-build`, but it won't apply the schema. For Phase 0:

```bash
# Pull env vars locally
npx vercel env pull .env.production
# Apply schema to production DB
DATABASE_URL="<your DIRECT_URL>" npx prisma db push
```

Once the schema settles (later phases), switch to `prisma migrate deploy` in the build script.

### 4. Verify

- First push to `main` should trigger a deploy.
- Deploy should be green.
- Open the deploy URL → placeholder home loads.

## Env var checklist (Phase 0)

| Variable | Required | Source |
|---|---|---|
| `DATABASE_URL` | ✅ | Vercel Postgres dashboard (pooled) |
| `DIRECT_URL` | ✅ | Vercel Postgres dashboard (unpooled) |
| `NEXTAUTH_URL` | Phase 1 | Your deploy URL (e.g. `https://momdaily.vercel.app`) |
| `NEXTAUTH_SECRET` | Phase 1 | `openssl rand -base64 32` |
| `RESEND_API_KEY` | Phase 4 | resend.com dashboard |
| `EMAIL_FROM` | Phase 4 | Your verified sender |
| `ANTHROPIC_API_KEY` | Phase 8 | console.anthropic.com |

## Email domain DNS (Phase 4 prep — note now)

When you add Resend in Phase 4, you'll need:
- SPF record (TXT) on your sending domain
- DKIM record (TXT) from Resend dashboard
- DMARC record (TXT, start with `p=none` for monitoring)

Add these to your DNS provider before going live, even if it's a few weeks out — propagation can take 24h.

## Phase 0 Done Gate

- [ ] Repo pushed to GitHub
- [ ] Vercel project linked
- [ ] Vercel Postgres provisioned
- [ ] `DATABASE_URL` + `DIRECT_URL` set in Vercel env
- [ ] `prisma db push` applied to production DB
- [ ] Deploy on `main` is green
- [ ] Production URL loads the placeholder home

When all six are checked, Phase 0 is complete and you can start Phase 1.
