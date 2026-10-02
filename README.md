# Task Manager

Personal task manager (Node 22 + TypeScript): Fastify API, Drizzle + Postgres, React PWA (EN / PT-BR / ES, dark by default).
Zero-cost hosting: Vercel Hobby + Neon free Postgres + cron-job.org.

**Status:** Phase 1 (scaffold, schema, Google login, deploy skeleton) and Phase 2 (tasks/projects API + PWA UI) done.
Gmail/Calendar sync, automations, Telegram and push are Phases 3–5.

- Setup & deploy: [docs/SETUP.md](docs/SETUP.md)
- Layout: `apps/server` (API, schema, routes) · `apps/web` (PWA) · `api/index.ts` (Vercel function entry) · `drizzle/` (migrations) · `e2e/` (Playwright smoke test)
- Security: single-user allowlist, httpOnly signed session cookie, Google tokens AES-256-GCM encrypted at rest, cron endpoints guarded by `CRON_SECRET`, same-origin check on writes, no auto-send of email (draft-only scope).
