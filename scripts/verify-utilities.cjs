/* Verifies that the custom utilities this design system relies on actually
 * emitted CSS. A wrong Tailwind namespace fails silently — the class simply
 * never exists and the property it was meant to set is quietly absent — so this
 * is checked rather than assumed. */
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
  ".bg-navy-2",
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
  ".ghost-word",
  ".on-navy",
];

const missing = REQUIRED.filter((sel) => !css.includes(sel));

/* `--text-2xs` (0.75rem) is deliberately absent from the class list above and was
 * the one entry this check used to fail on. The step is still declared in the
 * scale at globals.css; it simply has no consumer yet, and Tailwind v4 removes an
 * unreferenced theme value, not just the utility generated from it. Verified
 * against a real build: `.text-3xs` appears both as a `:root` variable and as a
 * class because Logo.tsx uses it, while `--text-2xs` is absent from the output
 * entirely. Asserting it would demand the toolchain emit a step the design does
 * not use, which would mean writing a call site to satisfy a test.
 *
 * If 2xs ever gets used, add `.text-2xs` back to REQUIRED at that point: then it
 * is a real dependency and a missing utility would be a genuine regression.
 *
 * A class cannot be asserted as a variable here, because unlike `--text-display`
 * nothing references `--text-2xs` and so it is not emitted to `:root` either. */

/* Custom properties are checked separately from classes. `--text-display` is
 * consumed by the `h1` base rule rather than by a `text-display` utility, so
 * Tailwind is right not to emit a class for it — checking the variable is the
 * assertion that actually means something. */
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
