import { asc, eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { projects } from "../db/schema";

const create = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
const update = create.partial().extend({ archived: z.boolean().optional() });
const idParam = z.object({ id: z.string().uuid() });

export const projectRoutes: FastifyPluginAsync = async (app) => {
  const { db } = app;

  app.get("/projects", async () => db.select().from(projects).orderBy(asc(projects.name)));

  app.post("/projects", async (req, reply) => {
    const [row] = await db.insert(projects).values(create.parse(req.body)).returning();
    return reply.code(201).send(row);
  });

  app.patch("/projects/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const [row] = await db.update(projects).set(update.parse(req.body)).where(eq(projects.id, id)).returning();
    return row ?? reply.code(404).send({ error: "not_found" });
  });

  app.delete("/projects/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await db.delete(projects).where(eq(projects.id, id)); // tasks keep existing (project_id set null)
    return reply.code(204).send();
  });
};
