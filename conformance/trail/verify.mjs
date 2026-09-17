// Zero-dependency verifier. Node 18+. Exits non-zero on any failure.
//   node verify.mjs [path-to-vectors.json]

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? new URL('./jcs-comparison-v1-vectors.json', import.meta.url);
const set = JSON.parse(readFileSync(file, 'utf8'));

const sha256 = s => createHash('sha256').update(s, 'utf8').digest('hex');
const toHex = s => Buffer.from(s, 'utf8').toString('hex');

// RFC 8785 canonicalization, per the sample canonicalizer in Appendix A.
function jcs(value) {
  if (value === null || typeof value !== 'object' || value.toJSON != null) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(jcs).join(',') + ']';
  return '{' + Object.keys(value).sort()
    .map(k => JSON.stringify(k) + ':' + jcs(value[k]))
    .join(',') + '}';
}

// Property order is read from the canonical string, never by parsing it back.
// JSON.parse hoists integer-like keys to the front of a JavaScript object,
// which would destroy the ordering under test.
const orderFromString = str =>
  [...str.matchAll(/:"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);

let failures = 0;
const check = (label, got, want) => {
  if (got === want) { console.log(`  ok    ${label}`); return; }
  failures++;
  console.log(`  FAIL  ${label}`);
  console.log(`        want ${want}`);
  console.log(`        got  ${got}`);
};

console.log(`${set.suite}\n${set.author_set}\n`);

console.log('anchors');
for (const a of set.anchors) {
  const out = jcs(a.preimage);
  check(`${a.name}: canonical form`, out, a.jcs);
  check(`${a.name}: digest`, sha256(out), a.digest);
  if (a.utf8_hex) check(`${a.name}: utf-8 bytes`, toHex(out), a.utf8_hex);
  if (a.expected_value_order) {
    check(`${a.name}: property order`,
      JSON.stringify(orderFromString(out)),
      JSON.stringify(a.expected_value_order));
  }
}

console.log('\nvectors');
for (const v of set.vectors) {
  const out = jcs(v.preimage);
  check(`${v.name}: canonical form`, out, v.jcs);
  check(`${v.name}: digest`, sha256(out), v.digest);
}

console.log('\nproperties under test');
const byName = Object.fromEntries(set.vectors.map(v => [v.name, jcs(v.preimage)]));
check('nfc and nfd canonicalize differently',
  String(byName['unicode-nfc'] !== byName['unicode-nfd']), 'true');
check('993 and 992 as numbers collide',
  String(byName['int-above-2p53-as-number'] === byName['int-above-2p53-collision']), 'true');
check('993 as a string survives',
  String(byName['int-above-2p53-as-string'] !== byName['int-above-2p53-as-number']), 'true');

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
