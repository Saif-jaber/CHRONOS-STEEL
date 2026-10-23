// Verifies the custom utilities this design system relies on actually emitted CSS; a wrong Tailwind namespace fails silently.
const fs = require("node:fs");
const path = require("node:path");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

const files = walk(path.join(".next", "static")).filter(
  (f) => fs.statSync(f).size > 500,
);
if (files.length === 0) {
  console.error("no built CSS found");
  process.exit(1);
}

let css = "";
for (const f of files) css += fs.readFileSync(f, "utf8");

const REQUIRED = [
  // Namespaced @theme values.
  ".bg-paper",
  ".bg-paper-2",
  ".bg-navy",
  ".text-ink",
  ".text-ink-2",
  ".text-muted",
  ".text-silver",
  ".text-silver-2",
  ".text-navy-muted",
  ".border-rule",
  ".border-rule-2",
  ".border-navy",
  ".border-navy-rule",
  ".text-slate",
  ".font-display",
  ".font-body",
  ".font-measure",
  ".text-3xs",
  ".text-xs",
  ".text-2xl",
  ".text-hero",
  ".tracking-label",
  ".tracking-nav",
  ".ease-out",
  // Custom utilities declared by hand.
  ".dur-fast",
  ".dur-base",
  ".dur-slow",
  // Spacing namespace -> height and inset.
  ".h-nav",
  ".top-nav",
  ".z-nav",
  ".z-menu",
  // Hand-written component classes.
  ".container",
  ".eyebrow",
  ".cta",
  ".cta-arrow",
  ".rule-t",
  ".rule-b",
  ".section",
  ".hit",
  ".measure",
  ".prose-measure",
  ".disclosure",
  ".reveal",
  ".on-navy",
];

const missing = REQUIRED.filter((sel) => !css.includes(sel));

/* `--text-2xs` and `.ghost-word` are deliberately not asserted: the former is an unreferenced theme step Tailwind v4 tree-shakes; the latter was removed along with its rule in globals.css. Add `.text-2xs` back if it ever gains a consumer. */

/* Custom properties are checked separately from classes; `--text-display` has no utility class, only the `h1` base rule. */
const REQUIRED_VARS = [
  "--color-paper",
  "--color-navy",
  "--color-slate",
  "--color-silver",
  "--color-rule",
  "--font-display",
  "--font-body",
  "--font-measure",
  "--text-display",
  "--text-hero",
  "--section-pad",
  "--spacing-nav",
  "--z-index-nav",
  "--z-index-menu",
  "--dur-base",
];

const missingVars = REQUIRED_VARS.filter((v) => !css.includes(v));

console.log(`css files: ${files.length}  total bytes: ${css.length}`);
console.log(`classes checked:   ${REQUIRED.length}`);
console.log(`variables checked: ${REQUIRED_VARS.length}`);

if (missing.length) {
  console.log(`MISSING CLASSES (${missing.length}):`);
  for (const m of missing) console.log(`  ${m}`);
}
if (missingVars.length) {
  console.log(`MISSING VARIABLES (${missingVars.length}):`);
  for (const v of missingVars) console.log(`  ${v}`);
}
if (missing.length || missingVars.length) process.exit(1);
console.log("all required utilities present");
