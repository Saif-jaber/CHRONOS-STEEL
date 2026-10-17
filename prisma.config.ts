import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/** Prisma CLI config. Prisma 7 reads the DB URL here and does not load .env itself, hence `dotenv/config`. */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node node_modules/tsx/dist/cli.mjs prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
