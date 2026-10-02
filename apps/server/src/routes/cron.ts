import type { FastifyPluginAsync } from "fastify";
import { automationRuns } from "../db/schema";
import { safeEqual } from "../lib/crypto";

/**
 * Endpoints hit by cron-job.org. Authenticated with the CRON_SECRET header
 * (`Authorization: Bearer <secret>` or `x-cron-secret`).
 * Phase 1 ships only `ping`; email/job/calendar/briefing jobs land in later phases.
 */
export const cronRoutes: FastifyPluginAsync = async (app) => {
  const { config, db } = app;

  app.addHook("preHandler", async (req, reply) => {
    if (!req.url.startsWith("/api/cron/")) return;
    const header = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? (req.headers["x-cron-secret"] as string | undefined) ?? "";
    if (!config.CRON_SECRET || !safeEqual(header, config.CRON_SECRET)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });

  app.get("/api/cron/ping", async () => {
    await db.insert(automationRuns).values({ name: "ping", ok: true, finishedAt: new Date() });
    return { ok: true, at: new Date().toISOString() };
  });
};
