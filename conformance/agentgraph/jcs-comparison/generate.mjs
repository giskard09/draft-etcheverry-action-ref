// Generates the AgentAvow author-set for jcs-comparison-semantics-v1.
// Computes canonical bytes + digests fresh with the RFC 8785 sample canonicalizer,
// so the set is independently derived rather than transcribed. Anchors are the
// shared RFC reference data (reused verbatim from the trail set).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const sha256 = s => createHash('sha256').update(s, 'utf8').digest('hex');

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

const V = (name, failure_mode, note, preimage) => {
  const j = jcs(preimage);
  return { name, failure_mode, note, preimage, jcs: j, digest: sha256(j) };
};

const NFC = 'é';   // precomposed é
const NFD = 'é';  // decomposed é (U+0065 U+0301)

// key-position preimage: two keys that render identically (NFC/NFD é) plus z.
const kp = {};
kp[NFD] = 1; kp['z'] = 3; kp[NFC] = 2;

const vectors = [
  V('unicode-nfc', 'fails-closed',
    'Subject identifier with precomposed U+00E9.',
    { subject: `caf${NFC}-01` }),
  V('unicode-nfd', 'fails-closed',
    'The same identifier decomposed as U+0065 U+0301. Renders identically to unicode-nfc and canonicalizes to different bytes, because RFC 8785 section 3.1 preserves string data as is and applies no normalization.',
    { subject: `caf${NFD}-01` }),
  V('unicode-key-position', 'fails-closed',
    'Two subject-map keys that render identically — precomposed and decomposed é — alongside a key z. JCS sorts property names by UTF-16 code unit, so the decomposed key (leading U+0065) sorts before z and the precomposed key (U+00E9) after it. z lands between two keys the eye cannot tell apart. AgentAvow-specific; not in the trail set.',
    kp),
  V('int-above-2p53-as-number', 'fails-open',
    'Identifier 9007199254740993 as a JSON number. Outside the range RFC 8785 Appendix B note (1) says true integers SHOULD occupy; ECMA-262 serialization rounds it to ...992, so it is stored here in that rounded form.',
    { subject: 9007199254740992 }),
  V('int-above-2p53-collision', 'fails-open',
    'A distinct subject that, carried as a JSON number, produces the same canonical bytes as int-above-2p53-as-number. After canonicalization the two are indistinguishable, and nothing in the artefacts reveals it.',
    { subject: 9007199254740992 }),
  V('int-above-2p53-as-string', 'fails-open',
    'The same identifier carried as a string, per RFC 8785 Appendix D. It survives intact and no longer collides.',
    { subject: '9007199254740993' }),
];

const trail = JSON.parse(readFileSync(new URL('../../trail/jcs-comparison-v1-vectors.json', import.meta.url), 'utf8'));

const out = {
  suite: 'jcs-comparison-semantics-v1',
  spec: 'RFC 8785 (JSON Canonicalization Scheme)',
  derivation: 'jcs = RFC 8785 canonicalization of preimage, encoded UTF-8. digest = lowercase hex SHA-256 over those bytes.',
  author_set: 'agentgraph (AgentAvow / AgentGraph attestation layer, did:web:agentgraph.co). Independently generated with the RFC 8785 Appendix A sample canonicalizer; agrees with the trail set on the shared cases and adds unicode-key-position.',
  failure_modes: trail.failure_modes,
  purpose: trail.purpose,
  anchors: trail.anchors,
  vectors,
};

writeFileSync(
  new URL('./jcs-comparison-v1-vectors.json', import.meta.url),
  JSON.stringify(out, null, 2) + '\n',
);
console.log(`wrote ${vectors.length} vectors + ${out.anchors.length} anchors`);
