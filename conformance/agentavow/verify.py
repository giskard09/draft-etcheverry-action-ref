#!/usr/bin/env python3
"""Verify the AgentAvow JCS comparison-semantics author-set.

Re-derives every entry's canonical bytes and SHA-256 with AgentAvow's v2
attestation canonicalizer — the rfc8785 reference library (canonicalization id
`jcs-rfc8785-v1`) — and checks it against the recorded digest. A vector marked
`failure_mode: refuses` must raise IntegerDomainError and emit no bytes.

Dependency: `pip install rfc8785`. Run: `python verify.py`.
"""
import hashlib
import json
import pathlib
import sys

import rfc8785

VECTORS = pathlib.Path(__file__).with_name("agentavow-jcs-v1-vectors.json")


def digest(preimage):
    b = rfc8785.dumps(preimage)
    return b.decode("utf-8"), hashlib.sha256(b).hexdigest()


def main() -> int:
    data = json.loads(VECTORS.read_text())
    entries = [("anchor", a) for a in data["anchors"]] + [("vector", v) for v in data["vectors"]]
    failures = 0
    for kind, e in entries:
        name = e["name"]
        if e.get("failure_mode") == "refuses":
            try:
                rfc8785.dumps(e["preimage"])
            except rfc8785.IntegerDomainError:
                print(f"  OK   {kind:6} {name}  (refused, as recorded)")
                continue
            print(f"  FAIL {kind:6} {name}  expected a refusal, canonicalized instead")
            failures += 1
            continue
        jcs, dg = digest(e["preimage"])
        if jcs == e["jcs"] and dg == e["digest"]:
            print(f"  OK   {kind:6} {name}  {dg[:16]}…")
        else:
            print(f"  FAIL {kind:6} {name}\n       jcs   want={e['jcs']!r} got={jcs!r}\n       digest want={e['digest']} got={dg}")
            failures += 1
    print(f"\n{len(entries) - failures}/{len(entries)} entries verified.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
