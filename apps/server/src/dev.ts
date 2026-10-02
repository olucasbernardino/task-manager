import { loadConfig } from "./config";
import { createDb } from "./db/client";
import { buildApp } from "./app";

async function main() {
  const config = loadConfig();
  const { db } = createDb(config.DATABASE_URL);
  const app = await buildApp({ config, db });
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
