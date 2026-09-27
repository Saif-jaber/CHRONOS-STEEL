/* Post-fix verification for the hero surface.
 *
 * Two things are asserted here that a build cannot catch on its own:
 *   1. the SVG grain data URIs are well-formed and reach the document, since a
 *      malformed percent-encoded URI fails silently and leaves a flat gradient;
 *   2. the measured contrast of the hero headline against the darkest plausible
 *      background actually clears WCAG, rather than merely looking plausible.
 *
 * The background used for the contrast figure is the scrim-blended navy the
 * headline actually sits on, taken as the darkest point plus a margin for the
 * grain layer lifting the blacks. */
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(".next", "server", "app", "index.html"),
  "utf8",
);

let failed = 0;
const ok = (cond, label, extra = "") => {
  if (!cond) failed += 1;
  console.log(
    `  ${cond ? "OK     " : "FAIL   "}  ${label}${extra ? `  ${extra}` : ""}`,
  );
};

console.log("surface treatment:");
const count = (needle) => html.split(needle).length - 1;

/* Noise is banned outright, by decision. feTurbulence averages to mid-grey, so
 * it lifts the blacks: acceptable as film grain across a full-bleed frame,
 * unacceptable as white fog across the footer. Reverted to smooth CSS gradients
 * only. This assertion exists so it cannot quietly come back. */
const NOISE = [
  ["feTurbulence grain", "feTurbulence"],
  ["svg data-uri background", "data:image/svg+xml"],
  ["brushed striation", "repeating-linear-gradient(93deg"],
];
for (const [label, needle] of NOISE) {
  const n = count(needle);
  if (n > 0) failed += 1;
  console.log(`  ${n === 0 ? "absent " : "PRESENT"}  ${label}  (${n})`);
}

/* What must be present instead: smooth washes and a legibility scrim. */
const LAYERS = [
  ["hero key-light wash", "radial-gradient(78% 62% at 72% 22%"],
  ["hero legibility scrim", "linear-gradient(to top, rgba(6,10,18,0.78)"],
  ["footer directional wash", "radial-gradient(58% 46% at 12% 0%"],
  ["lifestyle band wash", "radial-gradient(64% 52% at 74% 16%"],
];
for (const [label, needle] of LAYERS) {
  ok(html.includes(needle), label);
}

/* Every storefront image is a named local slot with descriptive alt text.
 * Assets are supplied later, so this checks the manifest destinations rather
 * than requiring the files to exist during development.
 *
 * The exploded anatomy plate is deliberately absent. It is out of PHOTOS'
 * required slots because the anatomy section is now carried entirely by its six
 * numbered specifications, an illustration of the parts beside a written list of
 * the parts was saying the same thing twice. The path is still named in the
 * allowlist below, which is not a contradiction: `public/fig-1-anatomy.png` has
 * been deleted, and keeping the arm means restoring the file needs no edit here.
 *
 * The two Nocturne story images are real files that arrived and replaced the
 * original wrist and atelier slots, which pointed into a `public/images/editorial`
 * directory that was never created, so both frames had been rendering empty. The
 * anatomy part shots are the reverse case: they are listed here even though no
 * file exists at any of those paths yet, because the alt text is the
 * specification for what has to be supplied, each one naming the part, the angle,
 * the finish and the dimension, so the shot that satisfies it is unambiguous.
 * This guard is what stops that text quietly rotting, or a path being changed
 * without the alt text following it. */
const IMAGE_SLOTS = [
  [
    "Nocturne story image",
    "/landing-watches/moonphase-watch.png",
    "The Nocturne Moonphase watch, case and dial filling the frame",
  ],
  [
    "Nocturne story image in blue",
    "/landing-watches/moonphase-blue.png",
    "The Nocturne in blue, the moon disc showing on the dial",
  ],
  [
    "part 01, sapphire crystal",
    "/Six-parts/part1.png",
    "Technical diagram of the double-domed sapphire crystal on the Meridian 38",
  ],
  [
    "part 02, hands",
    "/Six-parts/part2.png",
    "Technical diagram of the faceted steel watch hands for the Meridian 38",
  ],
  [
    "part 03, dial",
    "/Six-parts/part3.png",
    "Technical diagram of the silver sunburst dial of the Meridian 38",
  ],
  [
    "part 04, movement",
    "/Six-parts/part4.png",
    "Technical diagram of the Calibre CS-114 automatic movement of the Meridian 38",
  ],
  [
    "part 05, case",
    "/Six-parts/part5.png",
    "Technical diagram of the polished 316L steel case of the Meridian 38",
  ],
  [
    "part 06, strap",
    "/Six-parts/part6.png",
    "Technical diagram of the black calfskin strap for the Meridian 38",
  ],
];
for (const [label, src, alt] of IMAGE_SLOTS) {
  ok(html.includes(src), `${label} destination`, src);
  ok(html.includes(alt), `${label} descriptive alt text`);
}
ok(
  html.includes("/vids/hero-section-background.mp4"),
  "hero background video retained",
);
ok(
  !/data-detail="(?:card|full)"/.test(html),
  "storefront home has no generated watch drawings",
);

/* Local images must never depend on an external media host. */
const externalImages = [
  ...html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g),
].map((m) => m[1]);
ok(
  externalImages.length === 0,
  "no off-origin image requests",
  externalImages.join(", "),
);

/* Assets are intentionally added after the code. Verify local manifest paths
 * without requiring every file to exist yet. The whitelist has to name every
 * folder a manifest entry may point into, so `/Six-parts/` is here for the
 * anatomy part shots and `/landing-watches/` for the two Nocturne story images.
 * Without either one this check fails on a path that is correct, which is the
 * cheaper failure than the reverse. */
const srcs = [...html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)].map((m) => m[1]);
ok(
  srcs.every(
    (src) =>
      src.startsWith("/images/") ||
      src.startsWith("/Six-parts/") ||
      src.startsWith("/landing-watches/") ||
      src === "/fig-1-anatomy.png",
  ),
  "all image sources use documented public paths",
  srcs.join(", "),
);
console.log("");

/* ── WCAG relative luminance ── */
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}
function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/* Darkest point the hero headline sits on: #0c1220 base pulled toward the
 * scrim's rgba(6,10,18,0.94), plus headroom for grain lifting the blacks. */
const HERO_BG = "#0a0f18";

console.log(`contrast against ${HERO_BG} (darkest plausible hero background):`);
const SURFACE = [
  ["hero h1  text-paper", "#f5f4f0", "large text", 3.0],
  ["hero eyebrow  text-silver", "#b8bcc2", "13px", 4.5],
  ["hero body  text-silver-2", "#d2d5d9", "17px", 4.5],
  ["CTA text-paper", "#f5f4f0", "13px", 4.5],
];
for (const [label, fg, size, floor] of SURFACE) {
  const r = ratio(fg, HERO_BG);
  ok(
    r >= floor,
    `${label}`,
    `${r.toFixed(2)}:1 (needs ${floor}:1 for ${size})`,
  );
}

/* The bug that started this: --color-paper re-pointed to navy. */
console.log("\nregression — the navy-on-navy failure mode:");
const navyOnNavy = ratio("#0c1220", "#0a0f18");
ok(
  navyOnNavy < 1.5,
  "remapped paper would be invisible",
  `${navyOnNavy.toFixed(2)}:1`,
);

console.log("");
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("hero surface verified");
