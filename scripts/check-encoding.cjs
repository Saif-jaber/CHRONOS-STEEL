const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2];
const bad = [];

// Mojibake (UTF-8 bytes mis-decoded as CP1252) shows up as a lead char followed by a CP1252 stand-in. Needles are named by code point, never pasted as characters.
const LEAD = /[\u00C2\u00C3\u00E2\u00EF\u00F4\u00F5]/;
// Excludes accented letters of ordinary European prose so the checker does not cry wolf.
const TRAIL = /[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/;

const NON_ASCII = /[^\x00-\x7F]/;
const QP = String.fromCharCode(0x22) + String.fromCharCode(0x3f);

/* Self-test: fixtures built from code points (not pasted characters) so this file cannot trip its own sweep. Note .cjs is not walked below, so this block is never scanned. */
const SELFTEST = [
  { cps: [0x00e2, 0x2020, 0x2019], label: "U+2192 right arrow, round tripped" },
  { cps: [0x00e2, 0x20ac, 0x2122], label: "U+2019 curly quote, round tripped" },
  { cps: [0x00e2, 0x201c, 0x201d], label: "U+201C curly double quote, round tripped" },
  { cps: [0x00c3, 0x00a9], label: "U+00E9 e-acute, round tripped" },
];
const CLEAN = [
  "3 \u2192 \"3 bar\"? No",
  "M\u00fcller\u00ae registered",
  "caf\u00e9 \u00e0 c\u00f4t\u00e9",
  "50 mm \u00b7 \u2014 \u00b7 39.2 mm",
];

const detects = (s) => {
  for (let i = 0; i < s.length - 1; i++) {
    if (LEAD.test(s[i]) && TRAIL.test(s[i + 1])) return true;
  }
  return false;
};

const selfTestFailures = [];
for (const { cps, label } of SELFTEST) {
  const s = String.fromCodePoint(...cps);
  if (!detects(s)) selfTestFailures.push(`detector missed its own fixture: ${label}`);
}
for (const s of CLEAN) {
  if (detects(s)) selfTestFailures.push(`detector false-positives on clean text: ${JSON.stringify(s)}`);
}
if (selfTestFailures.length) {
  console.error("check-encoding self-test failed:");
  for (const f of selfTestFailures) console.error("  x " + f);
  console.error("\n  The sweep cannot be trusted in this state, so it is reporting nothing.");
  process.exit(1);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|css|json|md|mjs)$/.test(entry.name)) check(full);
  }
}

function check(file) {
  const s = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const report = (line, label, at) => {
    const ctx = s.slice(Math.max(0, at - 40), at + 40).replace(/\n/g, "\\n");
    bad.push(`${rel}:${line}  ${label}\n      ...${ctx}...`);
  };

  // U+FFFD on its own is unambiguous, so it stays a simple substring scan.
  let r = s.indexOf(String.fromCharCode(0xfffd));
  while (r !== -1) {
    report(s.slice(0, r).split("\n").length, "U+FFFD replacement character", r);
    r = s.indexOf(String.fromCharCode(0xfffd), r + 1);
  }

  // Lead character followed by a CP1252 stand-in, i.e. a written mis-decode.
  for (let i = 0; i < s.length - 1; i++) {
    if (LEAD.test(s[i]) && TRAIL.test(s[i + 1])) {
      const cps = [s.codePointAt(i), s.codePointAt(i + 1)]
        .map((c) => "U+" + c.toString(16).toUpperCase().padStart(4, "0"))
        .join(" + ");
      report(s.slice(0, i).split("\n").length, `mojibake pair ${cps}`, i);
      i++;
    }
  }

  // A quote+question pair is only mojibake when welded to a non-ASCII char on the left.
  let j = s.indexOf(QP);
  while (j !== -1) {
    const before = s[j - 1];
    if (before !== undefined && NON_ASCII.test(before)) {
      report(s.slice(0, j).split("\n").length, "non-ASCII char welded to \"?", j);
    }
    j = s.indexOf(QP, j + 1);
  }
}

walk(ROOT);

if (bad.length === 0) {
  console.log("encoding sweep: clean, no mojibake found");
} else {
  console.log(`encoding sweep: ${bad.length} problem(s)\n`);
  for (const b of bad) console.log("  x " + b);
  process.exitCode = 1;
}
