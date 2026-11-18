import { fastify } from "fastify";
import type { FastifyInstance } from "fastify";
import { engineVersion } from "@3pop/engine";

export const buildApp = (): FastifyInstance => {
  const app: FastifyInstance = fastify({ logger: true });
  app.get("/health", async () => {
    return { status: "ok", engine: engineVersion() };
  });
  return app;
};
