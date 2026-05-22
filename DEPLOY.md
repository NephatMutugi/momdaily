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

## Phase 0 Done Gate

- [ ] Repo pushed to GitHub
- [ ] Vercel project linked
- [ ] Vercel Postgres provisioned
- [ ] `DATABASE_URL` + `DIRECT_URL` set in Vercel env
- [ ] `prisma db push` applied to production DB
- [ ] Deploy on `main` is green
- [ ] Production URL loads the placeholder home
