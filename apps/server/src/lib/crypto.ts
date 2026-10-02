import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

function keyFrom(b64: string): Buffer {
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return key;
}

/** AES-256-GCM. Output: base64(iv[12] | tag[16] | ciphertext). */
export function encrypt(plain: string, keyB64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(keyB64), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decrypt(payload: string, keyB64: string): string {
  const raw = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(keyB64), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
