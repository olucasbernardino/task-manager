# Setup guide (zero-cost stack)

Everything here is free. You need accounts on **Neon** (database), **Vercel** (hosting), **Google Cloud** (login + Gmail/Calendar) and **cron-job.org** (scheduler). Telegram is only needed in Phase 5.

Menu names change from time to time. If a button looks slightly different, look for the closest match and tell me what you see.

## Checklist (do in this order)

- [ ] 1. Neon: create the database project (Frankfurt) and copy the connection string
- [ ] 2. Generate three secrets on your computer
- [ ] 3. Vercel: import the repo to get your domain
- [ ] 4. Google Cloud: Branding, Audience (publish), Data Access
- [ ] 5. Google Cloud: create the Web OAuth client with your Vercel domain
- [ ] 6. Vercel: add environment variables and redeploy
- [ ] 7. Open the app and sign in with Google
- [ ] 8. cron-job.org: create the ping job
- [ ] 9. Install the app on your phone
- [ ] 10. (Phase 5) Telegram bot

Why this order: Google needs your Vercel domain for the redirect address, and Vercel needs the Google keys and the database string for its variables.

---

## 1. Neon (database)

The region cannot be changed after a project is created. If you created it in the wrong region, delete it and create a new one (it is empty, so nothing is lost).

**If you need to delete the wrong project**
1. Open <https://console.neon.tech> and click your project `task-manager`.
2. In the left menu click **Settings** (bottom).
3. Scroll to **Delete project**, click it, type the project name to confirm, and confirm.

**Create the project**
1. Go to <https://console.neon.tech/app/projects> and click **New project**.
2. **Project name:** `task-manager`.
3. **Region:** open the dropdown and choose **AWS Europe (Frankfurt) `eu-central-1`**.
4. **Services:** keep only **Postgres database** on. Leave Object storage, Functions, AI gateway and Neon Auth off.
5. Click **Create project**.

**Copy the connection string**
1. On the project dashboard click **Connect**.
2. Branch `main`, database `neondb`, role as shown.
3. Turn **Connection pooling** ON. The host in the string must now contain `-pooler`.
4. Copy the full string. It starts with `postgresql://` and usually ends with `?sslmode=require`.
5. Paste it into a private note. This is `DATABASE_URL`. Treat it like a password and never paste it into chat or a public place.

## 2. Generate three secrets

On your Mac open **Terminal** and run each line. Each prints one value. Copy each into your private note with its name.

```bash
openssl rand -hex 32       # SESSION_SECRET
openssl rand -base64 32    # TOKEN_ENCRYPTION_KEY
openssl rand -hex 24       # CRON_SECRET
```

Do not reuse one value for two names, and never commit them to the repo.

## 3. Vercel (hosting)

1. Go to <https://vercel.com>, sign in with GitHub, and choose the free **Hobby** plan (personal use).
2. On the **New Project** page, under **Import Git Repository**, find `task-manager` and click **Import**. (If it is missing, click **Adjust GitHub App Permissions** and allow the repo.)
3. On **Configure Project**:
   - **Project Name:** `task-manager` (or any name).
   - **Framework Preset:** `Other`.
   - **Root Directory:** `./`.
   - Leave **Build and Output Settings** alone. `vercel.json` sets everything, including the Frankfurt function region.
4. Do not add variables yet if you do not have them all. Click **Deploy**. The first deploy will probably fail because variables are missing. That is expected.
5. After it finishes (success or failure) open the project and click **Domains** (Settings, Domains). Note the domain, for example `task-manager-abc123.vercel.app`. Your app URL is `https://` plus that domain, with no trailing slash. This is your `APP_URL`.
   The simplest path is to use this Vercel domain as is.

## 4. Google Cloud: consent screen

Open <https://console.cloud.google.com>, select the `task-manager` project in the top bar, and open **Google Auth Platform** (search for it in the top search bar). Gmail API and Google Calendar API must already be enabled (APIs & Services, Library).

1. **Branding**
   - App name: `Task Manager`.
   - User support email: your Gmail.
   - Developer contact email: your Gmail.
   - Leave logo and domains empty. Save.
2. **Audience**
   - User type: **External**.
   - Under **Test users** click **Add users** and add `olucasbernardino@gmail.com`. Save.
   - Click **Publish app** and confirm. The status must read **In production**. This stops refresh tokens from expiring after 7 days. No Google verification review is required for personal use.
3. **Data Access** (left menu)
   - Click **Add or remove scopes**.
   - Tick `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
   - Use **Manually add scopes** at the bottom for these three, one per line, then **Add to table**:
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.compose
     https://www.googleapis.com/auth/calendar
     ```
   - Click **Update**, then **Save**.
   - Gmail scopes are "restricted". That is fine for an unverified personal app. You will see a warning at your first login.

## 5. Google Cloud: OAuth client

Do not use the old **Credentials, Create credentials** wizard. Use the Google Auth Platform pages.

1. Left menu: **Clients**, then **Create client**.
2. **Application type:** `Web application`.
3. **Name:** `task-manager-web`.
4. **Authorized JavaScript origins:** leave empty.
5. **Authorized redirect URIs:** click **Add URI** and enter exactly:
   `https://<your-vercel-domain>/api/auth/callback`
   For example `https://task-manager-abc123.vercel.app/api/auth/callback`. No trailing slash. It must match `APP_URL` plus `/api/auth/callback`.
6. Click **Create**.
7. A dialog shows the **Client ID** and **Client secret**. Copy both into your private note and also click **Download JSON** as a backup. These are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. If you lose the secret you can create a new one on the same client page.

If you later change the Vercel domain, edit the client and update the redirect URI as well as `APP_URL`.

## 6. Vercel: environment variables

1. In Vercel open your project, then **Settings, Environment Variables**.
2. Add each row. Environments: tick **Production** (and Preview if you want).

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string from step 1 |
| `SESSION_SECRET` | from step 2 |
| `TOKEN_ENCRYPTION_KEY` | from step 2 |
| `CRON_SECRET` | from step 2 |
| `GOOGLE_CLIENT_ID` | from step 5 |
| `GOOGLE_CLIENT_SECRET` | from step 5 |
| `APP_URL` | `https://<your-vercel-domain>` (no trailing slash) |
| `ALLOWED_EMAIL` | `olucasbernardino@gmail.com` |

3. Do **not** add `ENABLE_DEV_LOGIN` here. It is ignored in production.
4. Go to **Deployments**, open the latest one, click the three dots, then **Redeploy**. Wait for **Ready**.
   The build also creates the database tables automatically. If the build fails, open the deployment and copy the last 20 lines of the log to me.
5. Quick check: open `https://<your-vercel-domain>/api/health`. You should see `{"ok":true}`.

## 7. First login

1. Open `https://<your-vercel-domain>`.
2. Click **Sign in with Google** and choose `olucasbernardino@gmail.com`.
3. Google shows **Google hasn't verified this app**. Click **Advanced**, then **Go to Task Manager (unsafe)**. It is your own app, so this is expected once.
4. Tick all requested permissions and **Continue**.
5. You land in the app. Open **Settings**: Google should say **Connected**.

If you get "login failed", the usual causes are a redirect URI that does not exactly match, a wrong client secret, or `APP_URL` with a trailing slash. If you get "not allowed", you used a different Google account.

## 8. cron-job.org (scheduler)

1. Sign up at <https://cron-job.org> and confirm your email.
2. Click **Create cronjob**.
3. **Title:** `task-manager ping`. **URL:** `https://<your-vercel-domain>/api/cron/ping`.
4. **Execution schedule:** every 15 minutes. Time zone: `Europe/Madrid`.
5. Open the **Advanced** tab. Under **Headers** add name `Authorization`, value `Bearer <CRON_SECRET>` (the word Bearer, a space, then your secret).
6. Save, then click **Test run**. Expect status 200.
7. In the app, **Settings, Automation log** now lists the run.

Later phases add more jobs: `/api/cron/email`, `/api/cron/jobs`, `/api/cron/calendar` every 15 minutes and `/api/cron/briefing` daily at 08:00 Europe/Madrid. I will tell you when to create them.

## 9. Install on your phone

- **iPhone (Safari):** open the app URL, tap the Share icon, then **Add to Home Screen**.
- **Android (Chrome):** menu (three dots), then **Install app** or **Add to Home screen**.

## 10. Telegram (Phase 5, not needed yet)

Later: in Telegram open @BotFather, send `/newbot`, follow the prompts, and copy the token. I will guide you then.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Vercel build fails at migration | `DATABASE_URL` missing or not the Neon string. Re-copy it with pooling on. |
| `/api/health` returns 404 | Tell me. It would mean the function routing needs a tweak. |
| Login loops back to the login page | Cookies blocked, or `APP_URL` does not match the domain you opened. |
| `redirect_uri_mismatch` from Google | The URI in the Google client must be exactly `APP_URL` plus `/api/auth/callback`. |
| cron-job.org gets 401 | Header must be `Authorization: Bearer <CRON_SECRET>` and the Vercel variable must match. |

## Local development (optional)

```bash
cp .env.example .env     # fill SESSION_SECRET / TOKEN_ENCRYPTION_KEY
docker run -d --name tm-pg -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=taskmanager -p 5432:5432 postgres:16
export $(grep -v '^#' .env | xargs)
npm install
npm run db:migrate
npm run dev:server    # API on :3000
npm run dev:web       # PWA on :5173 (proxies /api)
```

With `ENABLE_DEV_LOGIN=true` the login page shows a "Dev login" button so you can work without Google.

Tests: `TEST_DATABASE_URL=postgres://postgres@localhost:5432/taskmanager_test npm test` (the API tests **wipe** that database, so use a throwaway one). Phone-viewport smoke test: run both dev servers, then `npm run e2e`.
