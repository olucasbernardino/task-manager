import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tm_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;
export const sessionMaxAge = MAX_AGE_S;

// Stateless signed session: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
// Implemented with node:crypto so there is no ESM-only dependency in the serverless bundle.
const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

export async function signSession(email: string, secret: string, now = Date.now()): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(now / 1000) + MAX_AGE_S })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export async function readSession(token: string | undefined, secret: string, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: unknown; exp?: unknown };
    if (typeof data.email !== "string" || typeof data.exp !== "number" || data.exp * 1000 < now) return null;
    return data.email;
  } catch {
    return null;
  }
}
