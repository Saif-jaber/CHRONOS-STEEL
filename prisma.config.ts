import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * Prisma 7 reads the database URL here rather than from the `datasource` block in
 * `schema.prisma`, and does not load `.env` on its own — hence `dotenv/config` at
 * the top, which is what makes `npx prisma migrate` and the app agree on which
 * database they are talking to.
 *
 * The seed command is invoked through `node` with an explicit path rather than the
 * `tsx` bin shim: this project lives in a directory containing `&`, and a shell
 * that splits on it will fail on the shim before tsx ever runs.
 */
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
