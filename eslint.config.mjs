import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client (`prisma generate`). Machine-written, regenerated
    // on every schema change, and linting it would only ever produce noise.
    "src/generated/**",
    // Standalone Node dev tooling (geometry audit). CommonJS by necessity, and
    // deliberately outside the app's TypeScript module graph.
    "scripts/**",
  ]),
]);

export default eslintConfig;
