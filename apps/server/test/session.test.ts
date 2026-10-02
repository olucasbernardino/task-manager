import { describe, expect, it } from "vitest";
import { readSession, signSession } from "../src/lib/session";

const secret = "s".repeat(40);

describe("session", () => {
  it("round-trips", async () => {
    expect(await readSession(await signSession("a@b.com", secret), secret)).toBe("a@b.com");
  });
  it("rejects wrong secret, tampering, garbage and missing tokens", async () => {
    const t = await signSession("a@b.com", secret);
    expect(await readSession(t, "x".repeat(40))).toBeNull();
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ email: "evil@x.com", exp: 9999999999 })).toString("base64url");
    expect(await readSession(`${forged}.${s}`, secret)).toBeNull();
    expect(await readSession(`${p}.${s}.extra`, secret)).toBeNull();
    expect(await readSession("garbage", secret)).toBeNull();
    expect(await readSession(undefined, secret)).toBeNull();
  });
  it("expires after 30 days", async () => {
    const t = await signSession("a@b.com", secret, 0);
    expect(await readSession(t, secret, 29 * 86400_000)).toBe("a@b.com");
    expect(await readSession(t, secret, 31 * 86400_000)).toBeNull();
  });
});
