import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { users } from "../db/schema";
import { encrypt, safeEqual } from "../lib/crypto";
import { SESSION_COOKIE, sessionMaxAge, signSession } from "../lib/session";

// Requested up-front so Phase 3 (Gmail/Calendar) needs no second consent screen.
// Mail: read + drafts only (never send). Calendar: read/write.
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/calendar",
];

const STATE_COOKIE = "tm_oauth_state";

export const authRoutes: FastifyPluginAsync = async (app) => {
  const { config, db } = app;
  const redirectUri = `${config.APP_URL}/api/auth/callback`;
  const cookieBase = { httpOnly: true, secure: config.isProd, sameSite: "lax" as const, path: "/" };

  async function startSession(reply: import("fastify").FastifyReply, email: string) {
    reply.setCookie(SESSION_COOKIE, await signSession(email, config.SESSION_SECRET), {
      ...cookieBase,
      maxAge: sessionMaxAge,
    });
  }

  app.get("/api/auth/google", async (_req, reply) => {
    if (!config.GOOGLE_CLIENT_ID) return reply.code(503).send({ error: "google_not_configured" });
    const state = randomBytes(24).toString("hex");
    reply.setCookie(STATE_COOKIE, state, { ...cookieBase, maxAge: 600 });
    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent", // guarantees a refresh token
      include_granted_scopes: "true",
      login_hint: config.ALLOWED_EMAIL,
      state,
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    "/api/auth/callback",
    async (req, reply) => {
      const { code, state, error } = req.query;
      const expected = req.cookies[STATE_COOKIE];
      reply.clearCookie(STATE_COOKIE, { path: "/" });
      if (error || !code || !state || !expected || !safeEqual(state, expected)) {
        return reply.redirect(`${config.APP_URL}/?login=failed`);
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID,
          client_secret: config.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) return reply.redirect(`${config.APP_URL}/?login=failed`);
      const tokens = (await tokenRes.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        scope: string;
      };

      const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      });
      if (!infoRes.ok) return reply.redirect(`${config.APP_URL}/?login=failed`);
      const info = (await infoRes.json()) as { sub: string; email: string; email_verified?: boolean; name?: string };

      // Allowlist: only Lucas's verified Google account may ever sign in.
      if (!info.email_verified || info.email.toLowerCase() !== config.ALLOWED_EMAIL.toLowerCase()) {
        return reply.redirect(`${config.APP_URL}/?login=denied`);
      }

      const values = {
        email: config.ALLOWED_EMAIL,
        name: info.name ?? null,
        googleSub: info.sub,
        accessTokenEnc: encrypt(tokens.access_token, config.TOKEN_ENCRYPTION_KEY),
        accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
        // Google only returns a refresh token on consent; keep the old one otherwise.
        ...(tokens.refresh_token
          ? { refreshTokenEnc: encrypt(tokens.refresh_token, config.TOKEN_ENCRYPTION_KEY) }
          : {}),
      };
      await db
        .insert(users)
        .values(values)
        .onConflictDoUpdate({ target: users.email, set: values });

      await startSession(reply, config.ALLOWED_EMAIL);
      return reply.redirect(`${config.APP_URL}/`);
    },
  );

  // Local development / automated tests only; config forces this off in production.
  if (config.devLogin) {
    app.post("/api/auth/dev-login", async (_req, reply) => {
      await db.insert(users).values({ email: config.ALLOWED_EMAIL }).onConflictDoNothing();
      await startSession(reply, config.ALLOWED_EMAIL);
      return { ok: true };
    });
  }

  app.get("/api/auth/me", async (req, reply) => {
    if (!req.userEmail || req.userEmail !== config.ALLOWED_EMAIL) return reply.code(401).send({ error: "unauthorized" });
    const [u] = await db.select().from(users).where(eq(users.email, req.userEmail));
    return {
      email: req.userEmail,
      name: u?.name ?? null,
      googleConnected: Boolean(u?.refreshTokenEnc),
      devLogin: config.devLogin,
    };
  });

  app.post("/api/auth/logout", async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });
};
