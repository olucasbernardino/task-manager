import { migrate } from "drizzle-orm/node-postgres/migrator";
import { resolve } from "node:path";
import { createDb } from "./client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const { db, pool } = createDb(url);
  await migrate(db, { migrationsFolder: resolve(__dirname, "../../../../drizzle") });
  await pool.end();
  console.log("migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
