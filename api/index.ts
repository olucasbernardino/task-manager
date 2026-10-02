import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { buildApp } from "../apps/server/src/app";
import { loadConfig } from "../apps/server/src/config";
import { createDb } from "../apps/server/src/db/client";

// Vercel serverless entry: the whole Fastify API runs as a single function.
let appPromise: Promise<FastifyInstance> | undefined;

function getApp() {
  appPromise ??= (async () => {
    const config = loadConfig();
    const { db } = createDb(config.DATABASE_URL);
    const app = await buildApp({ config, db });
    await app.ready();
    return app;
  })();
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    app.server.emit("request", req, res);
  } catch (err) {
    appPromise = undefined; // do not cache a failed start
    // Full error goes to the Vercel logs; the response only names invalid variables, never values.
    console.error("startup_failed", err);
    const invalid = err instanceof ZodError ? [...new Set(err.issues.map((i) => i.path.join(".")))] : undefined;
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "startup_failed", invalidEnv: invalid }));
  }
}
