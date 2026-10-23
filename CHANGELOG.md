# Changelog

## draft-etcheverry-action-ref-04 (proposed)

- 2026-10-23 - Section 10 cites SCITT as RFC 9943 and COSE Receipts as RFC 9942 (both published June 2026); the
  architecture draft reference is replaced. The pointer "the on-chain anchor described in Section 6" (Section 6 is
  Scope Conventions) now points to a new informative subsection, On-chain Anchoring, which states the AnchorRegistry
  interface and how an anchor is checked offline. Hardware-backed endorsement is attributed to Transparency Service
  profiles (CCF), not to the SCITT architecture. One sentence states that neither an on-chain anchor nor a SCITT
  receipt shows completeness.
- New Section 11, Implementation Status (RFC 7942), listing implementations from public records: the argentum-core
  reference, the action-ref-conformance Action, flareclaw-verifier, the APS SDK helper, AgentGraph, AgentAvow,
  SafeAgent, AgentOracle with AgentTrust, and AXES reference tooling.
- Proposed by magentixai; for the authors to accept, change or drop.

## draft-etcheverry-action-ref-01

- 2026-07-10 — Added signer-independence invariant to "authorization_ref Derivation"
  (4th invariant): the signer of the Decision record MUST be independent of the
  actor/executor, before the outcome is final. Distinguishes signer-of-record from
  recompute-and-certify/referee (after the fact), which does not satisfy the
  invariant. Text-only clarification of existing normative intent, no behavior
  change. Origin: distinction surfaced in A2A#1734 (babyblueviper1). Commit b60469e.
