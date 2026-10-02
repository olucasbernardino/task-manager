import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
  const local = /localhost|127\.0\.0\.1|\/tmp\//.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    // Serverless: keep one connection per instance; use Neon's pooled (-pooler) URL.
    max: 1,
    idleTimeoutMillis: 10_000,
    ssl: local ? undefined : { rejectUnauthorized: true },
  });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];
