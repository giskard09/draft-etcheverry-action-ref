# trail author-set: JCS comparison semantics

Conformance vectors for the comparison-semantics property discussed on
public-agent-identity and in w3c-cg/aikr issue #10.

    node verify.mjs

Zero dependencies, Node 18+. Exits non-zero on any failure.

## What this set shows

Canonicalization establishes that two artefacts are the same *document*. It
does not establish that they are about the same *subject*. These vectors give
two cases where that gap is observable in bytes:

- **Unicode normalization.** A subject identifier in precomposed and
  decomposed form renders identically and canonicalizes to different bytes.
  RFC 8785 section 3.1 requires string data be preserved as is and applies no
  normalization.
- **Integers above 2^53.** An identifier carried as a JSON number is subject
  to ECMA-262 rounding. Appendix B note (1) says true integers SHOULD occupy
  the range -9007199254740991 to 9007199254740991; Appendix D recommends
  strings above it. Two distinct identifiers outside that range can
  canonicalize to the same bytes.

Both follow from documented RFC 8785 behaviour, not from implementation error.
They are not symmetric, and each vector states which mode it exhibits:

- **fails-closed** — different canonical bytes for one subject. A relying party
  sees a conflict that is not there, and can investigate it.
- **fails-open** — identical canonical bytes for two subjects. A relying party
  sees a match that is not there, and nothing in the artefacts indicates it.

The Unicode case fails closed. The integer case fails open, which makes it the
more dangerous of the two: `int-above-2p53-collision` and
`int-above-2p53-as-number` carry distinct subjects and produce identical
canonical output.

## Anchors

The set proves itself against the RFC before reaching cases the RFC does not
cover.

- `rfc8785-3.2.4-utf8-bytes` — input from section 3.2.2, expected value is the
  UTF-8 hex listing published in section 3.2.4, transcribed from the RFC.
- `rfc8785-3.2.3-property-sorting` — the property-sorting test data from
  section 3.2.3, exercising UTF-16 code-unit ordering including a non-BMP
  surrogate pair.

## Note for implementers of JS harnesses

Do not verify property order by parsing the canonical string back into a
JavaScript object. JavaScript hoists integer-like keys to the front of an
object, so `Object.keys(JSON.parse(canonical))` reorders the very property
under test. The anchor B input contains the key `"1"` and will expose this.
Read the order from the string.

## Derivation

`jcs` is RFC 8785 canonicalization of `preimage`, encoded UTF-8.
`digest` is lowercase hex SHA-256 over those bytes.

Produced with `@trailprotocol/core` and cross-checked against the
`canonicalize` package. Independent of the AgentGraph author-set.
