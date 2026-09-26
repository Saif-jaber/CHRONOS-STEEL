const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2];
const bad = [];

// Anything in here is the residue of a UTF-8 round trip that was read as
// Latin-1: the U+FFFD replacement char, and quote/question pairs welded onto a
// non-ASCII character (the real signature was U+2014 followed by "?).
//
// A bare "? pair in ASCII prose is legitimate -- `3 → "3 bar"? No` is a real
// sentence in format.ts -- so it is only flagged when it touches a non-ASCII
// codepoint, which is what mojibake always looks like.
const SUSPECT = [
  [String.fromCharCode(0xfffd), "U+FFFD replacement character"],
  [String.fromCharCode(0xc3) + String.fromCharCode(0xa2), "A-circumflex"],
  [String.fromCharCode(0xe2) + String.fromCharCode(0x80), "stray UTF-8 lead byte"],
];

const NON_ASCII = /[^\x00-\x7F]/;
const QP = String.fromCharCode(0x22) + String.fromCharCode(0x3f);

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

  for (const [token, label] of SUSPECT) {
    let i = s.indexOf(token);
    while (i !== -1) {
      report(s.slice(0, i).split("\n").length, label, i);
      i = s.indexOf(token, i + 1);
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
