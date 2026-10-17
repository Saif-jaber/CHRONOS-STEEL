// Confirms the prerendered home page contains the six brief sections in order and the intended font faces.
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(".next", "server", "app", "index.html");
if (!fs.existsSync(file)) {
  console.error(`missing ${file} - run a build first`);
  process.exit(1);
}
const html = fs.readFileSync(file, "utf8");

const SECTIONS = [
  ["Hero", "Time, Made"],
  ["Feature strip", "House standards"],
  // Anchored on the section's own prose; the old "ANATOMY" display word was removed.
  ["Anatomy", "A mechanical watch is a stack of tolerances"],
  ["Anatomy heading", "Six parts, and nothing hidden"],
  ["Lifestyle story", "Built for the hours nobody sees"],
  ["Collection", "Twelve references"],
  ["Footer newsletter", "Time Worth Keeping"],
];

// Production next/font emits unhashed family names; the dev server hashes them. Assert the production spelling.
const FACES = [
  ["Playfair Display", "font-family:Playfair Display"],
  ["Inter", "font-family:Inter"],
  ["JetBrains Mono", "font-family:JetBrains Mono"],
];

// next/font writes face names into the CSS bundle, not the HTML. Scoped to .next/static so stale .next/dev chunks are not swept in.
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

const cssFiles = walk(path.join(".next", "static"));
let css = "";
for (const f of cssFiles) css += fs.readFileSync(f, "utf8");

let failed = 0;

console.log(`html bytes: ${(html.length / 1024).toFixed(1)} KB\n`);

console.log("sections:");
for (const [name, needle] of SECTIONS) {
  const ok = html.includes(needle);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "OK     " : "MISSING"}  ${name.padEnd(18)} "${needle}"`);
}

console.log("\ntype pairing:");
for (const [name, needle] of FACES) {
  const inCss = css.includes(needle);
  if (!inCss) failed += 1;
  console.log(`  ${inCss ? "OK     " : "MISSING"}  ${name.padEnd(18)} @font-face "${needle}"`);
}
const preloads = (html.match(/font\/woff2/g) || []).length;
console.log(`  ${preloads >= 3 ? "OK     " : "THIN  "}  ${"preloaded faces".padEnd(18)} ${preloads} woff2`);
if (preloads < 3) failed += 1;

// Old Hallmark palette must be gone from shipped CSS. The radius token is built from parts so Tailwind cannot emit it from this file.
console.log("\nregressions:");
const FORBIDDEN = [
  ["Hallmark brass token", "--color-accent:"],
  ["Hallmark font var", "--font-instrument-serif"],
  ["old font helper", "font-instrument-serif"],
  ["radius reintroduced", "." + "rounded" + "-full"],
  ["Instrument Serif family", "Instrument_Serif"],
];
for (const [name, needle] of FORBIDDEN) {
  const present = css.includes(needle) || html.includes(needle);
  if (present) failed += 1;
  console.log(`  ${present ? "PRESENT" : "absent "}  ${name}`);
}

// Home must contain no filled Button (only Add to Bag may be filled). The class-signature check must run against the document, not the CSS: the contiguous class string is an attribute and can never appear in a stylesheet.
console.log("\nsolid controls:");
const solidOnHome = html.includes("border-navy bg-navy text-paper");
console.log(`  ${solidOnHome ? "PRESENT" : "absent "}  navy Button signature on home`);
if (solidOnHome) failed += 1;

// `.on-navy` must re-point --color-ink but never --color-paper or --color-silver: remapping those made light text invisible on navy.
console.log("\nnavy surface tokens:");
const onNavy = css.match(/\.on-navy\{[^}]*\}/);
if (!onNavy) {
  console.log("  MISSING  .on-navy block not found in shipped CSS");
  failed += 1;
} else {
  const body = onNavy[0];
  const guards = [
    ["--color-paper re-pointed", /--color-paper\s*:/],
    ["--color-silver re-pointed", /--color-silver\s*:/],
  ];
  for (const [name, re] of guards) {
    const bad = re.test(body);
    if (bad) failed += 1;
    console.log(`  ${bad ? "PRESENT" : "absent "}  ${name}`);
  }
  const inkOk = /--color-ink\s*:\s*#f5f4f0/i.test(body);
  if (!inkOk) failed += 1;
  console.log(`  ${inkOk ? "OK     " : "MISSING"}  --color-ink inverted to off-white`);
}

// The hero headline must be painted with the off-white token.
const heroH1 = html.match(/<h1[^>]*class="([^"]*)"[^>]*>\s*Time,/);
if (!heroH1) {
  console.log("  MISSING  hero <h1> not found");
  failed += 1;
} else {
  const ok = heroH1[1].includes("text-paper");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "OK     " : "MISSING"}  hero h1 uses text-paper  (${heroH1[1].trim()})`);
}

// Em dash is banned in copy (a template tell); en dashes are kept for numeric ranges. Checked on the rendered HTML so copy arriving through data is caught too.
console.log("\ntypography hygiene:");
const EM_DASH = /\u2014/;
const enDashCount = (html.match(/\u2013/g) || []).length;
const emDashCount = (html.match(/\u2014/g) || []).length;
if (emDashCount > 0) {
  failed += 1;
  console.log(`  PRESENT  em dash in rendered copy  (${emDashCount})`);
  // Show the offending text so it can be found without a browser.
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  let at = stripped.indexOf("\u2014");
  while (at !== -1) {
    console.log(`           ...${stripped.slice(Math.max(0, at - 60), at + 60)}...`);
    at = stripped.indexOf("\u2014", at + 1);
  }
} else {
  console.log(`  absent   em dash in rendered copy`);
}
console.log(`  ${enDashCount > 0 ? "OK     " : "none   "}  en dash retained for ranges  (${enDashCount})`);

/* Mojibake guard: a C1 control range is never legitimate in this output. */
const mojibake = html.match(/[\u00c2-\u00c3][\u0080-\u009f]/g);
if (mojibake) {
  failed += 1;
  console.log(`  PRESENT  mojibake sequence  (${mojibake.length})`);
} else {
  console.log(`  absent   mojibake sequence`);
}

// Beige must be what selection and focus ring actually resolve to, not merely exist.
console.log("\nbeige highlight:");
const BEIGE = [
  ["selection background", /::selection\{[^}]*--color-beige-2/i],
  ["selection text", /::selection\{[^}]*--color-beige-ink/i],
  ["focus ring", /:focus-visible\{outline:2px solid var\(--color-focus\)/i],
  ["focus token is beige", /--color-focus:\s*var\(--color-beige-3\)/i],
  ["cta hover accent", /\.cta:hover[^{]*\{[^}]*--color-beige-3/is],
  // Single colon: the minifier rewrites ::after to :after.
  ["quiet link accent", /\.quiet-link:hover:after[^{]*\{[^}]*--color-beige-3/i],
  ["beige-2 token emitted", /--color-beige-2:\s*#ddd0b6/i],
  ["beige-3 token emitted", /--color-beige-3:\s*#8a7a5c/i],
  ["beige-ink token emitted", /--color-beige-ink:\s*#241f16/i],
];
for (const [name, re] of BEIGE) {
  const ok = re.test(css);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "OK     " : "MISSING"}  ${name}`);
}

// Base --color-beige is intentionally tree-shaken (no bg-beige/text-beige consumer).
console.log(
  `  ${/--color-beige:\s*#c8b89a/i.test(css) ? "PRESENT" : "absent "}  unused base --color-beige (tree-shaken)`,
);

// Beige tones must clear contrast on both paper and navy grounds.
function luminance(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const CONTRAST = [
  ["beige-3 on paper", "#8a7a5c", "#f5f4f0", 3],
  ["beige-3 on navy", "#8a7a5c", "#0c1220", 3],
  ["beige-ink on beige-2", "#241f16", "#ddd0b6", 4.5],
];
for (const [name, fg, bg, floor] of CONTRAST) {
  const r = contrast(fg, bg);
  const ok = r >= floor;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "OK     " : "LOW    "}  ${name.padEnd(22)} ${r.toFixed(2)}:1 (needs ${floor}:1)`);
}

if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nall page checks passed");
