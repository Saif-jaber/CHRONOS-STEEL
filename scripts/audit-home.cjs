/* Confirms the prerendered home page really contains the six sections the brief
 * asks for, in order, and that the font pairing resolved to the intended faces.
 * A section that silently fails to render still produces a valid page, so this
 * asserts the markup rather than trusting the build to have complained. */
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
  ["Anatomy", "ANATOMY"],
  ["Anatomy heading", "Six parts, and nothing hidden"],
  ["Lifestyle story", "Built for the hours nobody sees"],
  ["Collection", "Twelve references"],
  ["Footer newsletter", "Time Worth Keeping"],
];

/* Production next/font emits unhashed family names ("Playfair Display"); the dev
 * server uses hashed ones ("__Playfair_Display_1dd02c61"). Assert the
 * production spelling, since that is what ships. */
const FACES = [
  ["Playfair Display", "font-family:Playfair Display"],
  ["Inter", "font-family:Inter"],
  ["JetBrains Mono", "font-family:JetBrains Mono"],
];

/* next/font hashes its generated family names and writes them into the CSS
 * bundle, not the HTML, so the face names are asserted against the stylesheet
 * while the preloads are asserted against the document.
 *
 * Scoped to .next/static on purpose. .next/dev still holds artifacts from the
 * previous type direction, and sweeping those in would report Hallmark fonts as
 * a live regression when they are only stale dev chunks. */
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

// The old Hallmark palette must be entirely gone from the shipped CSS.
// The radius token is assembled from parts on purpose: `src/app/globals.css`
// excludes this directory with `@source not`, but if that exclusion is ever
// removed, a literal here would make Tailwind emit the very utility this is
// checking for, and the check would fail on its own source text.
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

/* The brief allows exactly one filled control, and it is Add to Bag on a product
 * page. The home page must therefore contain none. Asserting the navy Button's
 * literal class signature is the precise check; counting "bg-navy" would also
 * match the footer and the hero band.
 *
 * This asserts against the document, not the stylesheet, and that distinction is
 * the whole check. Tailwind emits one rule per utility — `.border-navy{…}`,
 * `.bg-navy{…}`, `.text-paper{…}` — so the contiguous string
 * "border-navy bg-navy text-paper" is a class *attribute* and can never appear
 * in a CSS file at all. Reading the bundle therefore returned false
 * unconditionally: the guard reported "absent" whether or not home actually
 * rendered a solid control, and it would have kept passing if someone had put a
 * navy Button on the home page.
 *
 * The outline variant is the near-miss that makes the signature worth asserting
 * rather than dropping to a count. Home does render outline controls, and their
 * tail is `border-rule-2 bg-transparent text-ink hover:border-navy hover:text-navy`
 * — it contains "border-navy" and "text-navy" but never adjacent to "bg-navy",
 * so it stays out of this guard while the filled control is caught. */
console.log("\nsolid controls:");
const solidOnHome = html.includes("border-navy bg-navy text-paper");
console.log(`  ${solidOnHome ? "PRESENT" : "absent "}  navy Button signature on home`);
if (solidOnHome) failed += 1;

/* The headline once rendered navy-on-navy. `.on-navy` re-points the ink family
 * so sections on navy can keep using text-ink, but it must not re-point
 * --color-paper: `text-paper` is how light text is written on a dark ground, so
 * remapping it made the hero headline, the arrow CTAs and the footer heading
 * invisible. Nor --color-silver, which lands near 3.9:1 at 13px.
 *
 * Asserting the absence of these two re-definitions catches the whole class,
 * rather than screenshotting one headline. */
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
  // The remap that IS wanted: ink family must still be inverted.
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

/* Typography hygiene, asserted on the shipped HTML.
 *
 * The em dash is banned in copy. It is the punctuation mark this design reads
 * as a template tell: it arrives in AI-written marketing copy by reflex, and
 * the house register is quiet, so it has been removed entirely. A middot or a
 * comma does the separating work.
 *
 * Asserted against the rendered document rather than the source, because that
 * is what a reader sees, and because it also catches copy that arrives through
 * data (the product stories in products.ts are the risk here, not the JSX).
 *
 * En dashes are NOT banned. `13-15px`, `45-75ch` and `${lo}-${hi} mm` are
 * numeric ranges, where an en dash is the correct mark and a hyphen is not. */
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

/* Mojibake guard. Several source comments were once written through a latin1
 * round trip, which stores an em dash as the three code points U+00E2 U+0080
 * U+0094 and renders it as "aEUR".". It survived a naive em dash count because
 * the character is no longer an em dash. A C1 control range is never legitimate
 * in this output, so its presence is a hard failure. */
const mojibake = html.match(/[\u00c2-\u00c3][\u0080-\u009f]/g);
if (mojibake) {
  failed += 1;
  console.log(`  PRESENT  mojibake sequence  (${mojibake.length})`);
} else {
  console.log(`  absent   mojibake sequence`);
}

/* Beige is the highlight colour. Asserted in the shipped CSS rather than by
 * eye, because the requirement is not "a beige exists" but "beige is what the
 * cursor highlight and the focus ring actually resolve to". */
console.log("\nbeige highlight:");
const BEIGE = [
  ["selection background", /::selection\{[^}]*--color-beige-2/i],
  ["selection text", /::selection\{[^}]*--color-beige-ink/i],
  ["focus ring", /:focus-visible\{outline:2px solid var\(--color-focus\)/i],
  ["focus token is beige", /--color-focus:\s*var\(--color-beige-3\)/i],
  ["cta hover accent", /\.cta:hover[^{]*\{[^}]*--color-beige-3/is],
  // Single colon: the minifier rewrites ::after to :after, so a double-colon
  // selector would report a false failure against the shipped bundle.
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

/* The base --color-beige is intentionally absent from the bundle: nothing uses
 * bg-beige or text-beige, and Tailwind v4 only emits theme variables that are
 * referenced. Asserted so the absence reads as intended rather than as a miss. */
console.log(
  `  ${/--color-beige:\s*#c8b89a/i.test(css) ? "PRESENT" : "absent "}  unused base --color-beige (tree-shaken)`,
);

/* The beige tones are only correct if they clear contrast on both grounds.
 * beige-3 is the interactive one and has to work on paper and on navy without
 * an override; beige-2 has to carry dark text. Recomputed here so a future
 * tweak to the hex cannot quietly break the guarantee the comment claims. */
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
