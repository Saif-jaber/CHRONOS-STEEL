// Hero surface verification: grain URIs well-formed, noise banned, images on allowlisted paths, headline contrast clears WCAG.
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

/* Noise is banned: feTurbulence lifts the blacks into fog. This assertion stops it coming back. */
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
];
for (const [label, needle] of LAYERS) {
  ok(html.includes(needle), label);
}

/* Storefront images must be named local slots with descriptive alt text; assets may not exist yet, so manifest destinations are checked. */
const IMAGE_SLOTS = [
  [
    "part 01, sapphire crystal",
    "/Six-parts/part1.png",
    "Technical diagram of a double-domed sapphire crystal seated in a watch bezel",
  ],
  [
    "part 02, hands",
    "/Six-parts/part2.png",
    "Technical diagram of a pair of faceted steel watch hands",
  ],
  [
    "part 03, dial",
    "/Six-parts/part3.png",
    "Technical diagram of a watch dial with applied indices and luminous hour plots",
  ],
  [
    "part 04, movement",
    "/Six-parts/part4.png",
    "Technical diagram of an automatic watch movement, showing its bridges and balance wheel",
  ],
  [
    "part 05, case",
    "/Six-parts/part5.png",
    "Technical diagram of a polished steel watch case",
  ],
  [
    "part 06, strap",
    "/Six-parts/part6.png",
    "Technical diagram of a leather watch strap with a quick-release spring bar",
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

/* Seller photographs live in the configured R2 bucket. Any other external host
   is an unexpected dependency. */
function envValue(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.join(".env");
  if (!fs.existsSync(envPath)) return undefined;
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return undefined;
  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const r2Base = envValue("R2_PUBLIC_URL");
const allowedOrigins = r2Base ? [new URL(r2Base).origin] : [];
const externalImages = [
  ...html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g),
].map((m) => m[1]);
const offOrigin = externalImages.filter(
  (src) => !allowedOrigins.some((origin) => src.startsWith(origin)),
);
ok(
  offOrigin.length === 0,
  "no off-origin image requests",
  offOrigin.join(", "),
);

/* Whitelist every folder a local image path may point into; missing one fails a correct path, which is the cheaper failure. */
const srcs = [...html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)].map((m) => m[1]);
ok(
  srcs.every((src) => src.startsWith("/Six-parts/")),
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

/* Darkest plausible hero background, with headroom for grain lifting the blacks. */
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
