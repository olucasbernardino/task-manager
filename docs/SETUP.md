# Setup guide (zero-cost stack)

You need four free accounts for Phases 1–2: **Neon**, **Google Cloud**, **Vercel**, and (optionally now, required for automations) **cron-job.org**. Telegram comes in Phase 5.

Work through the steps in order; each one produces values you paste into Vercel's environment variables (step 4).

## Checklist (do in this order)
- [ ] 1. Neon: create project, copy pooled `DATABASE_URL`
- [ ] 2. Vercel: import repo to get your domain (the first deploy may fail until step 5; that's fine)
- [ ] 3. Google Cloud: enable Gmail + Calendar APIs, consent screen (Branding, Audience, Data Access), **Publish app**
- [ ] 4. Google Cloud: Clients, create Web client with your Vercel redirect URI
- [ ] 5. Vercel: add environment variables, redeploy
- [ ] 6. Open the app, sign in with Google, accept the "unverified app" warning once
- [ ] 7. cron-job.org: ping job, test run returns 200
- [ ] 8. (Phase 5) Telegram bot via @BotFather

## 1. Neon (database)
1. Sign up at <https://neon.tech>. New project: name `task-manager`, region **AWS Europe (Frankfurt)**.
2. Services: keep only **Postgres database** on. Leave Object storage, Functions, AI gateway and Neon Auth off.
3. After creation click **Connect**, tick **Connection pooling**, and copy the connection string (host contains `-pooler`). This is `DATABASE_URL`.

## 2. Vercel (hosting)
1. Sign up at <https://vercel.com> with GitHub (free **Hobby** plan). **Add New, Project**, import `olucasbernardino/task-manager`. Framework preset "Other"; `vercel.json` sets build, output and the Frankfurt region.
2. Production branch: pick `main` once I merge, or deploy the `claude/confident-hopper-sap2o3` branch for the first test.
3. Note the domain Vercel assigns (e.g. `task-manager-xyz.vercel.app`). You need it for step 3.4.

## 3. Google Cloud (login + Gmail/Calendar access)
Project `task-manager` is created, Gmail API and Calendar API enabled.
1. **Google Auth Platform, Branding**: app name `Task Manager`, your email as support and developer contact.
2. **Audience**: user type **External**. Add `olucasbernardino@gmail.com` as a test user. Then **Publish app** (status "In production"), otherwise refresh tokens expire after 7 days. No Google verification review is needed for personal use.
3. **Data Access, Add or remove scopes**: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.compose`, `https://www.googleapis.com/auth/calendar`. Save.
4. **Clients, Create client**: type **Web application**, name `task-manager-web`. Authorized redirect URI: `https://<your-vercel-domain>/api/auth/callback`. Copy the **Client ID** and **Client secret** (the secret is shown once; download the JSON as a backup).
   Do not use the old "Credentials, Create credentials" wizard.

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

## 7. cron-job.org (scheduler)
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
