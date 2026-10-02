import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { Config } from "./config";
import type { Db } from "./db/client";
import { readSession, SESSION_COOKIE } from "./lib/session";
import { authRoutes } from "./routes/auth";
import { cronRoutes } from "./routes/cron";
import { projectRoutes } from "./routes/projects";
import { settingsRoutes } from "./routes/settings";
import { taskRoutes } from "./routes/tasks";

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
    db: Db;
  }
  interface FastifyRequest {
    userEmail: string | null;
  }
}

export interface AppDeps {
  config: Config;
  db: Db;
}

export async function buildApp({ config, db }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.isProd ? { level: "info" } : { level: "warn" } });
  app.decorate("config", config);
  app.decorate("db", db);
  app.decorateRequest("userEmail", null);
  await app.register(cookie);

  app.setErrorHandler((err: unknown, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: "validation", issues: err.issues });
    }
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode && e.statusCode < 500 ? e.statusCode : 500;
    if (status === 500) app.log.error(err);
    return reply.code(status).send({ error: status === 500 ? "internal" : (e.message ?? "error") });
  });

  // Resolve session on every request; individual routes decide whether to require it.
  app.addHook("onRequest", async (req) => {
    req.userEmail = await readSession(req.cookies[SESSION_COOKIE], config.SESSION_SECRET);
  });

  // CSRF defence for cookie auth: state-changing API calls must come from our own origin.
  app.addHook("onRequest", async (req, reply) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
    if (req.url.startsWith("/api/cron/") || req.url.startsWith("/api/telegram/")) return;
    const origin = req.headers.origin;
    if (origin && origin !== new URL(config.APP_URL).origin) {
      return reply.code(403).send({ error: "bad_origin" });
    }
  });

  app.get("/api/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(cronRoutes);
  await app.register(
    async (api) => {
      api.addHook("preHandler", async (req, reply) => {
        if (!req.userEmail || req.userEmail !== config.ALLOWED_EMAIL) {
          return reply.code(401).send({ error: "unauthorized" });
        }
      });
      await api.register(taskRoutes);
      await api.register(projectRoutes);
      await api.register(settingsRoutes);
    },
    { prefix: "/api" },
  );

  return app;
}
