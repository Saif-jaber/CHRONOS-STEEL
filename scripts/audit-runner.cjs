/**
 * Builds the site with the render-audit route enabled, then asserts the SVG
 * geometry. Cross-platform wrapper so it does not depend on `VAR=1 cmd` syntax,
 * which differs between PowerShell, cmd and bash.
 *
 * Run: npm run audit:geometry
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

function run(label, file, args) {
  process.stdout.write(`\n> ${label}\n`);
  const res = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, RENDER_AUDIT: "1" },
  });
  if (res.status !== 0) {
    console.error(`\n${label} failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

run("next build (RENDER_AUDIT=1)", nextBin, ["build"]);
run("geometry assertions", path.join(__dirname, "audit-geometry.cjs"), []);

console.log("\ngeometry audit passed");
