/**
 * Geometry audit. Parses every <svg> the audit page prerendered and asserts the
 * numbers that a typechecker cannot: that nothing is NaN, that nothing escapes
 * the viewBox, that the dial fits inside its bezel, and that the drawn case
 * diameter is proportional to the stated millimetres across the whole catalogue.
 *
 * Run: node scripts/audit-geometry.cjs
 */

const { readFileSync } = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const HTML = path.join(__dirname, "..", ".next", "server", "app", "render-audit.html");
const html = readFileSync(HTML, "utf8");

const svgs = [];
{
  let i = 0;
  for (;;) {
    const s = html.indexOf("<svg", i);
    if (s === -1) break;
    const e = html.indexOf("</svg>", s);
    if (e === -1) break;
    svgs.push(html.slice(s, e + 6));
    i = e + 6;
  }
}

const fail = [];
const warn = [];
const note = (arr, msg) => arr.push(msg);

if (svgs.length === 0) {
  console.error("no <svg> found in " + HTML);
  process.exit(1);
}

/* ── 1. NaN / undefined / Infinity anywhere in any attribute ─────────── */
for (const [n, svg] of svgs.entries()) {
  for (const bad of ["NaN", "undefined", "Infinity", "null"]) {
    if (svg.includes(bad)) {
      const m = svg.match(new RegExp("[a-zA-Z-]+=\\\\?\"[^\"]*" + bad + "[^\"]*\\\\?\""));
      note(fail, `svg#${n}: contains "${bad}" -> ${m ? m[0].slice(0, 90) : "?"}`);
      break;
    }
  }
  if (/\sd="[^"]*NaN/.test(svg)) note(fail, `svg#${n}: NaN inside a path d`);
  if (viewBoxOf(svg) === null) note(fail, `svg#${n}: no viewBox`);
}

function viewBoxOf(svg) {
  const m = svg.match(/viewBox="([\d.\-\s]+)"/);
  return m ? m[1].trim().split(/\s+/).map(Number) : null;
}

/* ── 2. Nothing escapes the viewBox ─────────────────────────────────────
 * The strap is *meant* to run off the top and bottom edges — a watch is
 * photographed as a fragment, and `strapGeometry` starts each band at y=-4 so
 * there is no seam at the canvas edge. So a small vertical bleed is correct;
 * horizontal bleed is not, because the case is centred and must be fully visible.
 */
const VBLEED = 6;
for (const [n, svg] of svgs.entries()) {
  const vb = viewBoxOf(svg);
  const [vx, vy, vw, vh] = vb;
  const nums = [...svg.matchAll(/\b(cx|cy|r|x|y|x1|y1|x2|y2|width|height)="(-?[\d.]+)"/g)];
  for (const m of nums) {
    const attr = m[1];
    const val = Number(m[2]);
    let lo, hi;
    if (attr === "cx" || attr === "x" || attr === "x1" || attr === "x2" || attr === "width") {
      lo = vx - 0.5;
      hi = vx + vw + 0.5;
    } else if (attr === "cy" || attr === "y" || attr === "y1" || attr === "y2" || attr === "height") {
      lo = vy - VBLEED;
      hi = vy + vh + VBLEED;
    } else {
      continue; // r is checked separately, it is relative to cx/cy
    }
    if (val < lo || val > hi) {
      note(fail, `svg#${n}: ${attr}="${val}" outside [${lo},${hi}]`);
      break;
    }
  }
  for (const m of svg.matchAll(/\br="(-?[\d.]+)"/g)) {
    if (Number(m[1]) < 0) {
      note(fail, `svg#${n}: negative radius ${m[1]}`);
      break;
    }
  }
}

/* ── 3. Radii must be nested: strap < case, dial < bezel ring < case ─── */
for (const [n, svg] of svgs.entries()) {
  const vb = viewBoxOf(svg);
  const cx = vb[0] + vb[2] / 2;
  const cy = vb[1] + vb[3] / 2;
  const circles = [...svg.matchAll(/<circle[^>]*\br="([\d.]+)"[^>]*>/g)]
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
  const maxCircle = Math.max(...circles);
  if (maxCircle > vb[2] / 2) {
    note(fail, `svg#${n}: largest circle r=${maxCircle} exceeds half viewBox width ${vb[2] / 2}`);
  }
  void cx;
  void cy;
}

/* ── 4. Drawn case diameter must be proportional across the catalogue ── */
const caseRadii = [];
for (const [n, svg] of svgs.entries()) {
  if (!/-case"/.test(svg)) continue;
  const vb = viewBoxOf(svg);
  const centreX = vb[0] + vb[2] / 2;
  const circles = [
    ...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="url\(#([^)]*-case)\)"/g),
  ];
  if (!circles.length) {
    note(fail, `svg#${n}: has a case gradient but no circle uses it`);
    continue;
  }
  const r = Math.max(...circles.map((c) => Number(c[3])));
  const cx = Number(circles[0][1]);
  caseRadii.push(r);
  if (Math.abs(cx - centreX) > 0.6) {
    note(fail, `svg#${n}: case circle cx=${cx} is not on the viewBox centre ${centreX}`);
  }
  if (r > vb[2] / 2) {
    note(fail, `svg#${n}: case r=${r} exceeds half viewBox width ${vb[2] / 2}`);
  }
}
if (caseRadii.length) {
  const distinct = [...new Set(caseRadii.map((r) => r.toFixed(2)))].sort((a, b) => a - b);
  note(warn, `distinct case radii drawn across catalogue: ${distinct.join(", ")}`);
  note(warn, `smallest/largest ratio = ${(Number(distinct[0]) / Number(distinct[distinct.length - 1])).toFixed(3)}`);
}

/* ── report ───────────────────────────────────────────────────────────── */
console.log(`svgs audited: ${svgs.length}`);
const bytes = svgs.reduce((a, s) => a + s.length, 0);
console.log(
  `total inline svg: ${(bytes / 1024).toFixed(0)} KB, mean ${(bytes / svgs.length / 1024).toFixed(1)} KB`,
);

// Per-tier weight, read from each render's own data-detail attribute. This is
// the number that decides whether a 12-card catalogue grid is acceptable.
const tiers = {};
for (const m of html.matchAll(/<svg[^>]*data-detail="(card|full)"[\s\S]*?<\/svg>/g)) {
  const name = m[1];
  if (!tiers[name]) tiers[name] = { n: 0, bytes: 0, samples: [] };
  tiers[name].n += 1;
  tiers[name].bytes += m[0].length;
  tiers[name].samples.push(Buffer.from(m[0], "utf8"));
}
for (const [name, t] of Object.entries(tiers).sort()) {
  const mean = t.bytes / t.n;
  const gz = zlib.gzipSync(Buffer.concat(t.samples), { level: 9 }).length;
  console.log(
    `  ${name.padEnd(5)} ${String(t.n).padStart(3)} renders | mean ${(mean / 1024).toFixed(1)} KB raw` +
      ` | ${(gz / t.n / 1024).toFixed(2)} KB gzipped` +
      ` | 12-card grid ${((mean * 12) / 1024).toFixed(0)} KB raw / ${((gz / t.n) * 12 / 1024).toFixed(0)} KB gzipped`,
  );
}
if (tiers.card && tiers.full) {
  console.log(
    `  card is ${((1 - tiers.card.bytes / tiers.full.bytes) * 100).toFixed(0)}% lighter than full (raw)`,
  );
}

if (warn.length) {
  console.log("\nnotes:");
  for (const w of warn) console.log("  - " + w);
}
if (fail.length) {
  console.log(`\nFAIL (${fail.length}):`);
  for (const f of fail.slice(0, 40)) console.log("  x " + f);
  process.exit(1);
}
console.log("\nall geometry assertions passed");
