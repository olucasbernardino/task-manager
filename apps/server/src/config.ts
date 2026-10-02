import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  APP_URL: z.string().default("http://localhost:5173"),
  ALLOWED_EMAIL: z.string().email().default("olucasbernardino@gmail.com"),
  CRON_SECRET: z.string().default(""),
  ENABLE_DEV_LOGIN: z.string().default("false"),
});

export type Config = z.infer<typeof schema> & { isProd: boolean; devLogin: boolean };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  const isProd = parsed.NODE_ENV === "production";
  return {
    ...parsed,
    isProd,
    // Dev login can never be enabled in production.
    devLogin: !isProd && parsed.ENABLE_DEV_LOGIN === "true",
  };
}
