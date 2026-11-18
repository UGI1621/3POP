import { buildApp } from "./app.ts";
import type { FastifyInstance } from "fastify";

const rawPort = process.env.PORT;
const strPort = rawPort ?? "3000";
const port = Number(strPort);
if (Number.isNaN(port)) {
  throw new Error(`invalid port number: ${port}`);
}

const rawHost = process.env.HOST;
const host = rawHost ?? "127.0.0.1";

const app: FastifyInstance = buildApp();
try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
