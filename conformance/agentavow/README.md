# AgentAvow author-set — JCS comparison semantics (v1)

An independent author-set for `jcs-comparison-semantics-v1`, alongside the `trail`
set. It exists to demonstrate the interop property the suite is about:
canonicalization establishes that two artefacts are the *same document*, not that
they are *about the same subject*.

The bytes here are produced by **AgentAvow's v2 attestation canonicalizer** — the
[`rfc8785`](https://pypi.org/project/rfc8785/) reference library, canonicalization
id `jcs-rfc8785-v1` — independently of the `trail` set.

## What it shows

- **Agreement where bytes exist.** The two RFC 8785 anchors (§3.2.4 UTF-8 byte
  listing, §3.2.3 property sorting), the Unicode NFC/NFD pair, and the
  string-encoded identifier all reproduce the `trail` digests byte-for-byte. Two
  implementations that did not share code agreeing is the only real portability
  proof.
- **A third behavior on the integer edge.** For an identifier above 2^53 carried
  as a JSON number, `trail`'s canonicalizer serializes lossily and two distinct
  subjects collide to one canonical form (fails-open). AgentAvow's canonicalizer
  **refuses** — `rfc8785.dumps` raises `IntegerDomainError` and emits nothing, so
  the collision is not representable through this path. That is strictly safer
  than fails-open, and it is the third point in the failure space (refuse, versus
  fail-open collision, versus fail-closed divergence).

## Files

- `agentavow-jcs-v1-vectors.json` — the anchors and vectors, each with its
  preimage, canonical string, SHA-256 digest (or a recorded refusal), and failure
  mode.
- `verify.py` — re-derives every entry with the same canonicalizer and checks it.
  `pip install rfc8785 && python verify.py`.

## Failure modes

- **fails-closed** — different canonical bytes for one subject; a relying party
  sees a conflict that is not there.
- **fails-open** — identical canonical bytes for two subjects; a relying party
  sees a match that is not there, and nothing in the artefacts indicates it.
- **refuses** — the canonicalizer rejects the input and produces no canonical
  bytes; no collision is representable through this path.
