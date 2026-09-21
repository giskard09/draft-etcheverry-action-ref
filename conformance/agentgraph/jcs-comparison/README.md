# agentavow author-set: JCS comparison semantics

Conformance vectors for the comparison-semantics property discussed on
public-agent-identity, in w3c-cg/aikr issue #10, and in the §4.1 subsection of
`trust/kroftrust.md` (w3c-cg/aikr PR #11).

    node verify.mjs

Zero dependencies, Node 18+. Exits non-zero on any failure.

## What this set shows

Canonicalization establishes that two artefacts are the same *document*. It does
not establish that they are about the same *subject*. These vectors give cases
where that gap is observable in bytes:

- **Unicode normalization, value position.** A subject identifier in precomposed
  and decomposed form renders identically and canonicalizes to different bytes.
  RFC 8785 section 3.1 requires string data be preserved as is and applies no
  normalization. `unicode-nfc`, `unicode-nfd`.
- **Unicode normalization, key position.** Two subject-map keys that render
  identically — a precomposed and a decomposed é — alongside a key `z`.
  Property names sort by UTF-16 code unit, so the decomposed key (leading
  U+0065) sorts before `z` and the precomposed key (U+00E9) after it: `z` lands
  between two keys the eye cannot tell apart. `unicode-key-position`.
- **Integers above 2^53.** An identifier carried as a JSON number is subject to
  ECMA-262 rounding. Appendix B note (1) says true integers SHOULD occupy the
  range -9007199254740991 to 9007199254740991; Appendix D recommends strings
  above it. Two distinct identifiers outside that range can canonicalize to the
  same bytes. `int-above-2p53-as-number`, `int-above-2p53-collision`,
  `int-above-2p53-as-string`.

Both classes follow from documented RFC 8785 behaviour, not from implementation
error. They are not symmetric, and each vector states which mode it exhibits:

- **fails-closed** — different canonical bytes for one subject. A relying party
  sees a conflict that is not there, and can investigate it.
- **fails-open** — identical canonical bytes for two subjects. A relying party
  sees a match that is not there, and nothing in the artefacts indicates it.

The Unicode cases fail closed. The integer case fails open, which makes it the
more dangerous of the two: `int-above-2p53-as-number` and
`int-above-2p53-collision` carry distinct subjects and produce identical
canonical output.

## Independence and cross-check with the trail set

This is AgentAvow's author-set, generated with the RFC 8785 Appendix A sample
canonicalizer independently of the trail set in `../../trail`. On the five cases
both sets carry, the digests are byte-identical, and each set's verifier passes
the other set's vectors. Two implementations that did not share code, agreeing
on the canonical bytes without a private mapping, is the portability these
vectors exist to demonstrate. `unicode-key-position` is added here and is not in
the trail set.

## Anchors

The set proves itself against the RFC before reaching cases the RFC does not
cover. Both anchors are the shared reference data from RFC 8785, identical for
any conformant implementation.

- `rfc8785-3.2.4-utf8-bytes` — input from section 3.2.2, expected value is the
  UTF-8 hex listing published in section 3.2.4.
- `rfc8785-3.2.3-property-sorting` — the property-sorting test data from section
  3.2.3, exercising UTF-16 code-unit ordering including a non-BMP surrogate
  pair.

## Note for implementers of JS harnesses

Property order must be read from the canonical string and never by parsing it
back, because JavaScript hoists integer-like keys to the front of an object and
so destroys the ordering under test. The RFC 8785 section 3.2.3 anchor contains
the key `"1"` and will expose a harness that gets this wrong.

## Regenerating

`node generate.mjs` recomputes the vector file from the preimages, so the
canonical bytes and digests are derived rather than transcribed.
