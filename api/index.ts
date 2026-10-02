import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
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
  const app = await getApp();
  app.server.emit("request", req, res);
}
