import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The one Prisma client for the app.
 *
 * A module-level singleton rather than `new PrismaClient()` per file: each
 * instance opens its own pool, and a route, a page and a repository each holding
 * one would quietly triple the connections against a local Postgres. The adapter
 * is Prisma 7's required driver — the client no longer speaks the wire protocol
 * itself, `pg` does.
 *
 * The connection string comes from `.env`, which Next loads for the server and
 * `prisma.config.ts` (via dotenv) loads for the CLI, so migrations, Studio and
 * the running app all agree on one database without any of them being told twice.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy it into .env — the Prisma config and the app both read it from there.",
  );
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
