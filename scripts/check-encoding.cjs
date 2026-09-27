const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2];
const bad = [];

// Mojibake is a UTF-8 byte sequence that was decoded as Windows-1252, so what
// lands in the file is not one odd character but a PAIR: a lead character from
// the Latin-1 supplement, then a character from the CP1252 0x80-0x9F block or the
// CP1252 specials that stands in for 0x80-0x9F. U+2192 stored as e2 86 92 and
// read as CP1252 is U+00E2 U+2020 U+2019, which is three characters on screen and
// a three-character-wide gap in the layout.
//
// The previous version of this file missed all of it, and the reason is worth
// keeping in mind. It built its needles as
// `String.fromCharCode(0xc3) + String.fromCharCode(0xa2)` and expected that
// expression to be the A-circumflex, but `fromCharCode` takes code points, not
// bytes, so it is U+00C3 U+00A2, two characters, and the A-circumflex it was
// named after is the single code point U+00E2. The other needle had the same
// problem one character along, asking for U+0080 where the file held U+2020. So
// the sweep reported clean while a CTA arrow was rendering as garbage on the
// live page, which is the worst failure mode an audit can have: it is not wrong
// in a way anyone notices.
//
// Both bad needles are named here by code point rather than written out, because
// pasting the characters themselves into this file would plant live mojibake in
// the one file whose job is to report it.
//
// So the test is on the pair, by shape rather than by exact sequence.
const LEAD = /[\u00C2\u00C3\u00E2\u00EF\u00F4\u00F5]/;
// Deliberately excludes U+00E0, U+00E8, U+00E9 and U+00FC, which are the
// accented letters of ordinary European prose. Including them would flag real
// text like "Müller®", where U+00AE is a legitimate registered trademark, and a
// checker that cries wolf on correct text gets ignored.
const TRAIL = /[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/;

const NON_ASCII = /[^\x00-\x7F]/;
const QP = String.fromCharCode(0x22) + String.fromCharCode(0x3f);

/* Self-test. A detector that matches nothing is indistinguishable from a clean
 * repository, which is precisely how the old version of this file came to pass
 * while the page was visibly broken. These fixtures are built from code points
 * rather than pasted as characters, so the test file cannot itself be the thing
 * that trips the sweep, and so the code points under test stay legible.
 *
 * Note that .cjs is not in the extension list walked below, so this block is not
 * scanned either way. That is convenient here and is not the reason to rely on it. */
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

  // The replacement character on its own is unambiguous, unlike the pair test,
  // so it stays a simple substring scan.
  let r = s.indexOf(String.fromCharCode(0xfffd));
  while (r !== -1) {
    report(s.slice(0, r).split("\n").length, "U+FFFD replacement character", r);
    r = s.indexOf(String.fromCharCode(0xfffd), r + 1);
  }

  // A lead character followed by a CP1252 stand-in, which is what a mis-decode
  // actually looks like once it has been written to disk.
  for (let i = 0; i < s.length - 1; i++) {
    if (LEAD.test(s[i]) && TRAIL.test(s[i + 1])) {
      const cps = [s.codePointAt(i), s.codePointAt(i + 1)]
        .map((c) => "U+" + c.toString(16).toUpperCase().padStart(4, "0"))
        .join(" + ");
      report(s.slice(0, i).split("\n").length, `mojibake pair ${cps}`, i);
      i++;
    }
  }

  // A quote+question pair is only mojibake when it is welded to a non-ASCII
  // character on the left.
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
