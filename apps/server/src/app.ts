import { fastify } from "fastify";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { engineVersion } from "@3pop/engine";

type HealthCheckableRedis = {
  readonly isReady: boolean;
  ping(): Promise<unknown>;
};

export type Deps = {
  pool: pg.Pool;
  redis: HealthCheckableRedis;
};

type CheckResult = "ok" | "error";

export const buildApp = (deps: Deps): FastifyInstance => {
  const app: FastifyInstance = fastify({ logger: true });

  app.get("/health", async (_request, reply) => {
    let db: CheckResult = "ok";
    try {
      await deps.pool.query("SELECT 1");
    } catch (err) {
      app.log.error(err, "postgres health check failed");
      db = "error";
    }

    let redis: CheckResult = "ok";
    try {
      if (!deps.redis.isReady) {
        throw new Error("redis client is not ready");
      }
      await deps.redis.ping();
    } catch (err) {
      app.log.error(err, "redis health check failed");
      redis = "error";
    }

    const ok = db === "ok" && redis === "ok";
    if (!ok) {
      reply.code(503);
    }
    return { status: "ok", engine: engineVersion(), db, redis };
  });
  return app;
};
