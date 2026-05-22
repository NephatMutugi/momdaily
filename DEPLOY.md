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

## Env var checklist

| Variable | Required by | Source |
|---|---|---|
| `DATABASE_URL` | Phase 0 | Vercel Postgres dashboard (pooled) |
| `DIRECT_URL` | Phase 0 | Vercel Postgres dashboard (unpooled) |
| `NEXTAUTH_URL` | Phase 1 | Your deploy URL (e.g. `https://momdaily.vercel.app`) |
| `NEXTAUTH_SECRET` | Phase 1 | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Optional | console.cloud.google.com (see "Google sign-in" section) |
| `GOOGLE_CLIENT_SECRET` | Optional | console.cloud.google.com |
| `RESEND_API_KEY` | Phase 4 | resend.com dashboard |
| `EMAIL_FROM` | Phase 4 | `MomDaily <hello@yourverifieddomain.com>` |
| `CRON_SECRET` | Phase 4 | `openssl rand -base64 32` |
| `APP_ORIGIN` | Phase 4 (optional) | Override for `NEXTAUTH_URL` if you want cron to hit a preview |
| `ANTHROPIC_API_KEY` | Phase 8 | console.anthropic.com |

## Google sign-in (optional)

NextAuth supports Google OAuth out of the box. The button on /signup and
/login automatically hides if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
aren't set, so this is fully optional.

### One-time Google Cloud Console setup

1. Open https://console.cloud.google.com — sign in, create or pick a project.
2. **APIs & Services → OAuth consent screen** → choose **External**:
   - App name: `MomDaily`
   - User support email + developer contact: your email
   - Save. Default scopes are fine.
3. **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `momdaily-web`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-deploy.vercel.app`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-deploy.vercel.app/api/auth/callback/google`
4. Copy the **Client ID** and **Client secret** that appear in the dialog.
   The secret is shown once.

### Env vars to set (locally and in Vercel)

```
GOOGLE_CLIENT_ID="123...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### Test users while the OAuth screen is unpublished

In **OAuth consent screen → Test users → + Add users**, add the email(s) you
want to sign in with. Until you click **Publish app** at the top, only test
users can complete the OAuth flow — everyone else sees a "this app hasn't
been verified" wall.

When you're ready for real users, **Publishing status → Publish app**. You
won't need Google's verification review until you request sensitive scopes
(we only ask for email + profile, which are non-sensitive).

### Account linking note

Our config sets `allowDangerousEmailAccountLinking: true` on Google. That
means a user who originally signed up with email + password can later sign
in with Google (same email) and have it merged onto their existing User.
Google verifies email addresses, so the practical risk is low. If you ever
add a less-trusted OAuth provider, don't copy this flag onto it.

## Email setup (Phase 4)

### 1. Resend account + domain

- Create a Resend account, add your sending domain (e.g. `momdaily.app`).
- Resend dashboard will give you three DNS records to add — set them on your domain registrar:
  - **SPF** (TXT): `v=spf1 include:amazonses.com ~all` (Resend uses SES under the hood)
  - **DKIM** (TXT): the long string Resend hands you, under `resend._domainkey.yourdomain.com`
  - **DMARC** (TXT): start with `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` for monitoring; tighten to `p=quarantine` later.
- DNS propagation can take 24 hours. Resend verifies once records are live.
- Until verification, sends will work from the default `onboarding@resend.dev` address — fine for development, never for real users (deliverability is bad and the from address looks sketchy).

### 2. Cron — GitHub Actions, not Vercel Cron

We use **GitHub Actions** to schedule the morning email cron, not Vercel Cron.
Reason: Vercel's Hobby plan only allows daily schedules, and we need hourly
to serve users across timezones at their local 7 AM. GitHub Actions on the
free tier allows arbitrary cron schedules.

The workflow lives at `.github/workflows/morning-cron.yml` and fires
`0 * * * *` (every hour). It POSTs to `/api/cron/send-morning-emails` with
`Authorization: Bearer $CRON_SECRET`.

### One-time GitHub setup

In the repo settings: **Settings → Secrets and variables → Actions → New repository secret**, add two secrets:

| Secret | Value |
|---|---|
| `APP_URL` | Your production URL, e.g. `https://momdaily.vercel.app` (no trailing slash) |
| `CRON_SECRET` | Same value as the Vercel env var of the same name. Generate with `openssl rand -base64 32`. |

After adding the secrets, run the workflow manually once to verify:
**Actions tab → Morning email cron → Run workflow → Run**.

You should see a green check within ~30 seconds and a JSON summary in the
log: `{"candidates":N,"sent":N,"skipped":N,"failed":0,"errors":[]}`.

### Smoke test from your laptop (optional)

```bash
curl -i https://your-deploy.vercel.app/api/cron/send-morning-emails \
  -H "Authorization: Bearer $CRON_SECRET"
```

You should get a 200 with the same JSON summary.

### Timing notes

GitHub Actions cron isn't strictly punctual — runs can be delayed by up to
~15 minutes under load. Fine for a morning email; the endpoint is idempotent
(see `EmailSendLog` schema) so a delayed run still only sends once per
user per day.

### 3. Sender warm-up

Don't blast 1,000 cold emails on day one — Gmail and Outlook will throttle a brand-new sending domain. Ramp gradually:
- Days 1–3: <50 sends/day
- Week 1: <200/day
- Week 2: <500/day
- Past 2 weeks: scale freely

This is standard practice for any transactional sender.

## Phase 0 Done Gate

- [ ] Repo pushed to GitHub
- [ ] Vercel project linked
- [ ] Vercel Postgres provisioned
- [ ] `DATABASE_URL` + `DIRECT_URL` set in Vercel env
- [ ] `prisma db push` applied to production DB
- [ ] Deploy on `main` is green
- [ ] Production URL loads the placeholder home

## Phase 4 Done Gate

- [ ] Resend account + verified sending domain
- [ ] SPF, DKIM, DMARC DNS records live
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` set in Vercel env
- [ ] `APP_URL` + `CRON_SECRET` set as GitHub Actions repo secrets
- [ ] GitHub Actions workflow shows green on manual "Run workflow"
- [ ] Manual `curl` to the cron endpoint returns a 200 with summary JSON
- [ ] A real beta user receives the morning email at their local send hour
- [ ] Tapping a habit button in the email lands on `/dashboard?logged=ok` and shows the toast
- [ ] HabitLog row exists in DB for that user/habit/today
