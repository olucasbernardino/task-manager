import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, safeEqual } from "../src/lib/crypto";

const key = randomBytes(32).toString("base64");

describe("crypto", () => {
  it("round-trips and uses a fresh IV each time", () => {
    const a = encrypt("secret-token", key);
    expect(a).not.toContain("secret-token");
    expect(decrypt(a, key)).toBe("secret-token");
    expect(encrypt("secret-token", key)).not.toBe(a);
  });
  it("rejects tampering and wrong keys", () => {
    const a = Buffer.from(encrypt("x", key), "base64");
    a[a.length - 1]! ^= 1;
    expect(() => decrypt(a.toString("base64"), key)).toThrow();
    expect(() => decrypt(encrypt("x", key), randomBytes(32).toString("base64"))).toThrow();
  });
  it("rejects bad key length", () => {
    expect(() => encrypt("x", "short")).toThrow();
  });
  it("safeEqual compares strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
