import { and, asc, desc, eq, gte, isNotNull, lt, ne, sql, type SQL } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { tasks } from "../db/schema";

const status = z.enum(["inbox", "todo", "doing", "done"]);
const priority = z.enum(["low", "normal", "high", "urgent"]);
const isoDate = z.string().datetime({ offset: true }).transform((s) => new Date(s));

const create = z.object({
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(20_000).optional(),
  status: status.optional(),
  priority: priority.optional(),
  dueAt: isoDate.nullable().optional(),
  hasTime: z.boolean().optional(),
  projectId: z.string().uuid().nullable().optional(),
  position: z.number().optional(),
});
const update = create.partial();
const idParam = z.object({ id: z.string().uuid() });

const listQuery = z.object({
  status: status.optional(),
  projectId: z.string().uuid().optional(),
  /** Tasks due strictly before this instant (used for "Today"/overdue). */
  dueBefore: isoDate.optional(),
  /** Tasks due at/after this instant (used for "Upcoming"/calendar). */
  dueAfter: isoDate.optional(),
  hideDone: z.enum(["true", "false"]).optional(),
});

export const taskRoutes: FastifyPluginAsync = async (app) => {
  const { db } = app;

  app.get("/tasks", async (req) => {
    const q = listQuery.parse(req.query);
    const where: SQL[] = [];
    if (q.status) where.push(eq(tasks.status, q.status));
    if (q.projectId) where.push(eq(tasks.projectId, q.projectId));
    if (q.dueBefore) where.push(and(isNotNull(tasks.dueAt), lt(tasks.dueAt, q.dueBefore))!);
    if (q.dueAfter) where.push(and(isNotNull(tasks.dueAt), gte(tasks.dueAt, q.dueAfter))!);
    if (q.hideDone === "true") where.push(ne(tasks.status, "done"));
    return db
      .select()
      .from(tasks)
      .where(and(...where))
      .orderBy(asc(tasks.position), sql`${tasks.dueAt} asc nulls last`, desc(tasks.createdAt))
      .limit(1000);
  });

  app.post("/tasks", async (req, reply) => {
    const body = create.parse(req.body);
    const [row] = await db
      .insert(tasks)
      .values({
        ...body,
        position: body.position ?? Date.now(),
        completedAt: body.status === "done" ? new Date() : null,
      })
      .returning();
    return reply.code(201).send(row);
  });

  app.patch("/tasks/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const body = update.parse(req.body);
    const set: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.status) set.completedAt = body.status === "done" ? new Date() : null;
    const [row] = await db.update(tasks).set(set).where(eq(tasks.id, id)).returning();
    return row ?? reply.code(404).send({ error: "not_found" });
  });

  app.delete("/tasks/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await db.delete(tasks).where(eq(tasks.id, id));
    return reply.code(204).send();
  });
};
