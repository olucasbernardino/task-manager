import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { automationRuns, settings } from "../db/schema";
import { desc } from "drizzle-orm";

const patch = z.object({
  language: z.enum(["en", "pt-BR", "es"]),
  theme: z.enum(["dark", "light", "system"]),
  timezone: z.string().min(1).max(64),
  briefingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  cvText: z.string().max(50_000),
  targetRoles: z.string().max(2_000),
  aiEnabled: z.boolean(),
}).partial();

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  const { db } = app;

  async function getSettings() {
    await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
    const [row] = await db.select().from(settings).where(eq(settings.id, 1));
    return row!;
  }

  app.get("/settings", getSettings);

  app.patch("/settings", async (req) => {
    await getSettings();
    const [row] = await db.update(settings).set(patch.parse(req.body)).where(eq(settings.id, 1)).returning();
    return row!;
  });

  app.get("/automation-runs", async () =>
    db.select().from(automationRuns).orderBy(desc(automationRuns.startedAt)).limit(50),
  );
};
