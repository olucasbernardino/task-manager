import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tm_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signSession(email: string, secret: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(key(secret));
}

export async function readSession(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export const sessionMaxAge = MAX_AGE_S;
