# Setup guide (zero-cost stack)

You need four free accounts for Phases 1–2: **Neon**, **Google Cloud**, **Vercel**, and (optionally now, required for automations) **cron-job.org**. Telegram comes in Phase 5.

Work through the steps in order; each one produces values you paste into Vercel's environment variables (step 4).

## 1. Neon (database)
1. Sign up at <https://neon.tech> (GitHub login is fine). Create a project named `task-manager`, region closest to you (e.g. Frankfurt).
2. On the project dashboard click **Connect**, tick **Connection pooling**, and copy the connection string (the host contains `-pooler`). This is your `DATABASE_URL`.

## 2. Google Cloud (login + Gmail/Calendar access)
1. <https://console.cloud.google.com> → project picker → **New project** → `task-manager`.
2. **APIs & Services → Library**: enable **Gmail API** and **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** (Google Auth platform): User type **External**, app name `Task Manager`, your email as support/developer contact.
   Scopes: add `openid`, `email`, `profile`, `.../auth/gmail.readonly`, `.../auth/gmail.compose`, `.../auth/calendar`.
   Add yourself as a **test user**, then click **Publish app** (status "In production"). This stops refresh tokens expiring after 7 days. You'll see an "unverified app" warning once at login: **Advanced → Go to Task Manager (unsafe)** — it's your own app.
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   Authorized redirect URIs (add both):
   - `https://<your-vercel-domain>/api/auth/callback`
   - `http://localhost:5173/api/auth/callback` (local dev)
   Copy the **Client ID** and **Client secret**.

## 3. Vercel (hosting)
1. Sign up at <https://vercel.com> with GitHub (choose the free **Hobby** plan).
2. **Add New → Project** → import `olucasbernardino/task-manager`. Leave framework preset as "Other"; `vercel.json` already sets build/output.
3. Don't deploy yet — add the environment variables first (step 4). Note the production domain Vercel assigns (e.g. `task-manager-xyz.vercel.app`; you can pick a nicer one under Settings → Domains).

## 4. Environment variables (Vercel → Settings → Environment Variables, **Production**)
| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from step 2 |
| `APP_URL` | `https://<your-vercel-domain>` (no trailing slash) |
| `ALLOWED_EMAIL` | `olucasbernardino@gmail.com` |

Do **not** set `ENABLE_DEV_LOGIN` in production (it is ignored there anyway).
Then **Deploy**. The build runs database migrations automatically (`npm run vercel-build`).

## 5. cron-job.org (scheduler)
1. Sign up at <https://cron-job.org> (free).
2. **Create cronjob** → URL `https://<your-vercel-domain>/api/cron/ping`, schedule every 15 minutes.
3. Under **Advanced → Headers** add `Authorization` = `Bearer <CRON_SECRET>`.
4. Use **Test run**: expect HTTP 200. The run then shows up in the app under Settings → Automation log.
Later phases add `/api/cron/email`, `/api/cron/jobs`, `/api/cron/calendar` (every 15 min) and `/api/cron/briefing` (daily 08:00, timezone Europe/Madrid).

## Local development
```bash
cp .env.example .env     # fill SESSION_SECRET / TOKEN_ENCRYPTION_KEY
docker run -d --name tm-pg -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=taskmanager -p 5432:5432 postgres:16
export $(grep -v '^#' .env | xargs)   # or use your preferred env loader
npm install
npm run db:migrate
npm run dev:server    # API on :3000
npm run dev:web       # PWA on :5173 (proxies /api)
```
With `ENABLE_DEV_LOGIN=true` the login page shows a "Dev login" button so you can work without Google.

Tests: `TEST_DATABASE_URL=postgres://postgres@localhost:5432/taskmanager_test npm test` (the API tests **wipe** that database — use a throwaway one). Phone-viewport smoke test: run both dev servers, then `npm run e2e`.
