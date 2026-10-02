import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { loadConfig } from "../src/config";
import { createDb } from "../src/db/client";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("API (needs TEST_DATABASE_URL)", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let pool: ReturnType<typeof createDb>["pool"];
  let cookie = "";

  beforeAll(async () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_URL: url!,
      SESSION_SECRET: randomBytes(32).toString("hex"),
      TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
      CRON_SECRET: "cron-secret",
      ENABLE_DEV_LOGIN: "true",
    });
    const made = createDb(url!);
    pool = made.pool;
    await made.db.execute(sql`drop schema public cascade; create schema public;`);
    await made.db.execute(sql`drop schema if exists drizzle cascade;`);
    await migrate(made.db, { migrationsFolder: resolve(__dirname, "../../../drizzle") });
    app = await buildApp({ config, db: made.db });
    const res = await app.inject({ method: "POST", url: "/api/auth/dev-login" });
    cookie = String(res.cookies[0]!.name) + "=" + res.cookies[0]!.value;
  });
  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  const call = (method: "GET" | "POST" | "PATCH" | "DELETE", path: string, payload?: unknown, withCookie = true) =>
    app.inject({ method, url: path, payload: payload as object, headers: withCookie ? { cookie } : {} });

  it("requires a session", async () => {
    expect((await call("GET", "/api/tasks", undefined, false)).statusCode).toBe(401);
    expect((await call("GET", "/api/auth/me", undefined, false)).statusCode).toBe(401);
    expect((await call("GET", "/api/auth/me")).statusCode).toBe(200);
  });

  it("rejects cross-origin writes", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks",
      payload: { title: "x" },
      headers: { cookie, origin: "https://evil.example" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("task lifecycle + filters", async () => {
    const created = (await call("POST", "/api/tasks", { title: "Write tests" })).json();
    expect(created.status).toBe("inbox");
    expect((await call("POST", "/api/tasks", { title: "" })).statusCode).toBe(400);

    const done = (await call("PATCH", `/api/tasks/${created.id}`, { status: "done" })).json();
    expect(done.completedAt).not.toBeNull();
    const reopened = (await call("PATCH", `/api/tasks/${created.id}`, { status: "todo" })).json();
    expect(reopened.completedAt).toBeNull();

    await call("POST", "/api/tasks", { title: "Due soon", dueAt: "2030-01-01T10:00:00Z", hasTime: true });
    const before = (await call("GET", "/api/tasks?dueBefore=2030-06-01T00:00:00Z")).json();
    expect(before.map((t: { title: string }) => t.title)).toEqual(["Due soon"]);
    const open = (await call("GET", "/api/tasks?hideDone=true")).json();
    expect(open).toHaveLength(2);

    expect((await call("DELETE", `/api/tasks/${created.id}`)).statusCode).toBe(204);
    expect((await call("PATCH", `/api/tasks/${created.id}`, { title: "gone" })).statusCode).toBe(404);
  });

  it("projects: deleting keeps tasks", async () => {
    const p = (await call("POST", "/api/projects", { name: "Home", color: "#112233" })).json();
    const t = (await call("POST", "/api/tasks", { title: "Paint", projectId: p.id })).json();
    expect(t.projectId).toBe(p.id);
    await call("DELETE", `/api/projects/${p.id}`);
    const all = (await call("GET", "/api/tasks")).json();
    expect(all.find((x: { id: string }) => x.id === t.id).projectId).toBeNull();
  });

  it("settings validate and persist", async () => {
    expect((await call("GET", "/api/settings")).json().language).toBe("en");
    const s = (await call("PATCH", "/api/settings", { language: "pt-BR", theme: "system" })).json();
    expect(s).toMatchObject({ language: "pt-BR", theme: "system" });
    expect((await call("PATCH", "/api/settings", { language: "fr" })).statusCode).toBe(400);
  });

  it("cron endpoints need the secret", async () => {
    expect((await call("GET", "/api/cron/ping", undefined, false)).statusCode).toBe(401);
    const ok = await app.inject({ method: "GET", url: "/api/cron/ping", headers: { authorization: "Bearer cron-secret" } });
    expect(ok.statusCode).toBe(200);
    expect((await call("GET", "/api/automation-runs")).json()[0].name).toBe("ping");
  });
});

describe("config", () => {
  it("never enables dev login in production", () => {
    const c = loadConfig({
      NODE_ENV: "production",
      DATABASE_URL: "x",
      SESSION_SECRET: "x".repeat(32),
      TOKEN_ENCRYPTION_KEY: "x",
      ENABLE_DEV_LOGIN: "true",
    });
    expect(c.devLogin).toBe(false);
  });
});
