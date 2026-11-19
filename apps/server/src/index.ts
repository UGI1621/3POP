import { buildApp } from "./app.ts";
import type { FastifyInstance } from "fastify";
import pg from "pg";
import { createClient } from "redis";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`missing environment variable: ${name}`);
  }
  return value;
}

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
if (Number.isNaN(port)) {
  throw new Error(`invalid port number: ${rawPort}`);
}

const host = process.env.HOST ?? "127.0.0.1";

const dbUrl = requireEnv("DATABASE_URL");
const redisUrl = requireEnv("REDIS_URL");

const pool = new pg.Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 2000,
});
pool.on("error", (err) => console.error("postgres pool error", err));

const redis = createClient({ url: redisUrl });
redis.on("error", (err) => console.error("readis client error", err));
await redis.connect();

const app: FastifyInstance = buildApp({ pool, redis });
app.addHook("onClose", async () => {
  await pool.end();
  await redis.close();
});

const shutdown = async (signal: string) => {
  app.log.info(`receive ${signal}, shutting down`);
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
