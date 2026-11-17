#!/usr/bin/env python3
"""ref_v1_0_0.py - independent reference verifier for ProofBundle spec_ver 1.0.0 as encoded by the
May 2026 conformance corpus (vectors_v1.json, sha256 11aef10b...cfb3).

Written 2026-10-29/30 from the corpus bytes, not from the app's code and not from the May TS core.
Shares no code with proofbundle.html. Python stdlib + `cryptography` + `blake3`.

Every rule is stated once, applies to every vector, and names the corpus class that exhibits it.
No rule is keyed on a vector id.

Usage: python3 ref_v1_0_0.py vectors_v1.json out.tsv
"""
import base64, hashlib, json, re, sys
from datetime import datetime, timedelta, timezone

import blake3
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, padding, utils
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

# ---- registries of spec 1.0.0 (what the corpus treats as defined) ----
PROFILES = {"PB-INTEGRITY-1", "PB-BOUNDARY-1", "PB-LINEAGE-1", "PB-REGULATED-1"}
ENCODINGS = {"PB-CANON-JSON-1"}
DIGESTS = {
    "SHA-256": lambda d: hashlib.sha256(d).digest(),
    "SHA-384": lambda d: hashlib.sha384(d).digest(),
    "SHA-512": lambda d: hashlib.sha512(d).digest(),
    "BLAKE2b": lambda d: hashlib.blake2b(d).digest(),          # 512-bit output
    "BLAKE3": lambda d: blake3.blake3(d).digest(),              # 256-bit output
}
EC = {"ECDSA-P256": (ec.SECP256R1(), 32, hashes.SHA256()),
      "ECDSA-P384": (ec.SECP384R1(), 48, hashes.SHA384()),
      "ECDSA-P521": (ec.SECP521R1(), 66, hashes.SHA512())}
RSA = {"RSA-PSS-2048": hashes.SHA256(), "RSA-PSS-3072": hashes.SHA384(), "RSA-PSS-4096": hashes.SHA512()}
SIGS = {"Ed25519"} | set(EC) | set(RSA)
ATOMS = {"all", "any", "equals", "present", "range", "before", "after", "within",
         "expired", "not_expired", "within_last", "age_lt"}
B64U = re.compile(r"^[A-Za-z0-9_-]*$")


def b64d(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def b64e(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def canon(o):
    # PB-CANON-JSON-1 as the corpus uses it: sorted keys, no whitespace, UTF-8.
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


class Stop(Exception):
    def __init__(self, outcome, stage, why):
        self.outcome, self.stage, self.why = outcome, stage, why


def need(cond, outcome, stage, why):
    if not cond:
        raise Stop(outcome, stage, why)


def is_str(x):
    return isinstance(x, str)


# ---- boundary grammar ----
DUR = re.compile(r"^(\d+)([smhdw])$")
UNIT = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}


def ts(x):
    if not is_str(x):
        raise ValueError("timestamp is not a string")
    return datetime.fromisoformat(x.replace("Z", "+00:00"))


def dur(x):
    m = DUR.match(x) if is_str(x) else None
    if not m:
        raise ValueError("bad duration")
    return timedelta(seconds=int(m.group(1)) * UNIT[m.group(2)])


def get(ctx, path):
    cur = ctx
    for k in path.split("."):
        if not isinstance(cur, dict) or k not in cur:
            return None, False
        cur = cur[k]
    return cur, True


def atom(a, ctx):
    """Returns True/False. Raises Stop for not-defined (unknown operator) and indeterminate (known
    operator, malformed arguments). Classes: not-defined-in-this-version CV0150-type, indeterminate
    CV0191-0200-type, temporal-boundary, algorithm-boundary-fail."""
    need(isinstance(a, dict) and len(a) == 1, "indeterminate", "boundary", "atom is not a single-key object")
    (op, arg), = a.items()
    need(op in ATOMS, "not-defined-in-this-version", "boundary", f"atom '{op}' not defined in 1.0.0")
    bad = lambda why: Stop("indeterminate", "boundary", f"{op}: {why}")
    try:
        if op in ("all", "any"):
            if not isinstance(arg, list):
                raise bad("operand is not an array")
            rs = [atom(x, ctx) for x in arg]
            return all(rs) if op == "all" else any(rs)
        if op == "present":
            if not is_str(arg):
                raise bad("path is not a string")
            return get(ctx, arg)[1]
        if op in ("expired", "not_expired"):
            if not is_str(arg):
                raise bad("path is not a string")
            v, ok = get(ctx, arg)
            if not ok:
                return False
            now = ts(ctx["_now"]) if "_now" in ctx else datetime.now(timezone.utc)
            return (ts(v) <= now) if op == "expired" else (ts(v) > now)
        if not isinstance(arg, list) or not arg or not is_str(arg[0]):
            raise bad("operand is not [path, ...]")
        arity = {"equals": 2, "range": 3, "before": 2, "after": 2, "within": 3, "within_last": 2, "age_lt": 2}[op]
        if len(arg) != arity:
            raise bad(f"expects {arity} operands, got {len(arg)}")
        v, ok = get(ctx, arg[0])
        if op == "equals":
            return ok and v == arg[1]
        if op == "range":
            if not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in arg[1:]):
                raise bad("bounds are not numbers")
            return ok and isinstance(v, (int, float)) and arg[1] <= v <= arg[2]
        # temporal operands are validated before the context value is consulted
        if op in ("before", "after"):
            t = ts(arg[1])
            return ok and ((ts(v) < t) if op == "before" else (ts(v) > t))
        if op == "within":
            lo, hi = ts(arg[1]), ts(arg[2])
            return ok and lo <= ts(v) <= hi
        d = dur(arg[1])
        now = ts(ctx["_now"]) if "_now" in ctx else datetime.now(timezone.utc)
        return ok and (now - ts(v)) <= d if op == "within_last" else ok and (now - ts(v)) < d
    except Stop:
        raise
    except (ValueError, KeyError, TypeError) as e:
        raise bad(str(e))


# ---- signatures ----
def sig_ok(alg, pub_b64u, msg, sig):
    pk = b64d(pub_b64u)
    if alg == "Ed25519":
        Ed25519PublicKey.from_public_bytes(pk).verify(sig, msg)
    elif alg in EC:
        curve, n, h = EC[alg]
        need(len(sig) == 2 * n, "invalid-signature", "integrity", "ECDSA signature length")
        der = utils.encode_dss_signature(int.from_bytes(sig[:n], "big"), int.from_bytes(sig[n:], "big"))
        ec.EllipticCurvePublicKey.from_encoded_point(curve, pk).verify(der, msg, ec.ECDSA(h))
    else:
        h = RSA[alg]
        serialization.load_der_public_key(pk).verify(sig, msg, padding.PSS(mgf=padding.MGF1(h), salt_length=h.digest_size), h)
    return True


def verify(inp):
    b = inp.get("bundle")
    ctx = inp.get("context") or {}
    try:
        # 1 parse  (malformed: CV0106-0110)
        need(isinstance(b, dict), "malformed", "parse", "bundle is not a JSON object")
        # 2 schema (malformed: CV0111-0125)
        for k in ("hdr", "payload", "meta", "refs", "seal"):
            need(k in b, "malformed", "schema", f"missing {k}")
        extra = set(b) - {"hdr", "payload", "meta", "refs", "seal"}
        need(not extra, "malformed", "schema", f"extra top-level keys {sorted(extra)}")
        h, m, r, s = b["hdr"], b["meta"], b["refs"], b["seal"]
        need(isinstance(h, dict), "malformed", "schema", "hdr is not an object")
        for k in ("spec_id", "spec_ver", "profile", "bundle_id"):
            need(is_str(h.get(k)), "malformed", "schema", f"hdr.{k} missing or not a string")
        need(h["spec_id"] == "PROOFBUNDLE", "malformed", "schema", "hdr.spec_id is not PROOFBUNDLE")
        need(is_str(b["payload"]) and b["payload"] != "" and B64U.match(b["payload"]), "malformed", "schema", "payload is not non-empty base64url")
        need(isinstance(m, dict), "malformed", "schema", "meta is not an object")
        for k in ("producer_id", "created_at", "canonical_encoding", "digest_alg", "sig_alg", "proof_kind"):
            need(is_str(m.get(k)), "malformed", "schema", f"meta.{k} missing or not a string")
        need(isinstance(r, list), "malformed", "schema", "refs is not an array")
        need(isinstance(s, dict), "malformed", "schema", "seal is not an object")
        for k in ("digest_alg", "digest_b64u", "sig_alg", "signature_b64u"):
            need(is_str(s.get(k)), "malformed", "schema", f"seal.{k} missing or not a string")
        need(B64U.match(s["digest_b64u"]) and B64U.match(s["signature_b64u"]), "malformed", "schema", "seal value is not base64url")
        need(m["digest_alg"] == s["digest_alg"] and m["sig_alg"] == s["sig_alg"], "malformed", "schema", "meta and seal name different algorithms")
        # 3 resource budget (resource-exhausted: CV0246-0260)
        mb = inp.get("max_bundle_bytes")
        if mb is not None:
            n = len(canon(b))
            need(n <= mb, "resource-exhausted", "resource-budget", f"{n} canonical bytes > max_bundle_bytes {mb}")
        # 4 version (unknown-version: CV0126-0145)
        need(h["spec_ver"] == "1.0.0", "unknown-version", "version", f"spec_ver {h['spec_ver']!r} is not 1.0.0")
        # 5 defined-in-this-version (not-defined-in-this-version: CV0146-0170 except atom case)
        need(h["profile"] in PROFILES, "not-defined-in-this-version", "registry", f"profile {h['profile']!r}")
        need(m["canonical_encoding"] in ENCODINGS, "not-defined-in-this-version", "registry", f"encoding {m['canonical_encoding']!r}")
        need(s["digest_alg"] in DIGESTS, "not-defined-in-this-version", "registry", f"digest_alg {s['digest_alg']!r}")
        need(s["sig_alg"] in SIGS, "not-defined-in-this-version", "registry", f"sig_alg {s['sig_alg']!r}")
        # 6 integrity (invalid-signature: algorithm-tamper)
        dg = DIGESTS[s["digest_alg"]](canon({k: v for k, v in b.items() if k != "seal"}))
        need(b64e(dg) == s["digest_b64u"], "invalid-signature", "integrity", "digest of canonical bundle-without-seal differs from seal.digest_b64u")
        pub = inp.get("public_key_b64u")
        need(is_str(pub) and pub != "", "missing-side-info", "integrity", "no verification key supplied beside the 1.0.0 envelope")
        try:
            sig_ok(s["sig_alg"], pub, dg, b64d(s["signature_b64u"]))
        except Stop:
            raise
        except Exception as e:
            raise Stop("invalid-signature", "integrity", f"{s['sig_alg']} signature does not verify ({type(e).__name__})")
        # 7 policy (policy-denied: CV0261-0275)
        if h["profile"] == "PB-REGULATED-1":
            need(isinstance(m.get("hitl"), dict), "policy-denied", "policy", "PB-REGULATED-1 requires meta.hitl")
        # 8 side information (missing-side-info CV0171-0180, indeterminate CV0201-0210)
        if m.get("requires_side_attestations") is True:
            sa = m.get("side_attestations")
            need(isinstance(sa, list) and len(sa) > 0, "missing-side-info", "side-info", "required side attestations absent")
            for i, a in enumerate(sa):
                need(isinstance(a, dict) and all(is_str(a.get(k)) for k in ("role", "party", "statement", "signature_b64u")),
                     "indeterminate", "side-info", f"side_attestations[{i}] is malformed")
        # 9 lineage (verified CV0211-0222, lineage-invalid CV0223-0245, missing-side-info CV0181-0190)
        if r:
            parents = inp.get("parent_bundles") or []
            need(len(parents) > 0, "missing-side-info", "lineage", "refs present but no parent bundles supplied")
            for i, ref in enumerate(r):
                need(isinstance(ref, dict) and all(is_str(ref.get(k)) for k in ("parent_id", "parent_digest", "digest_alg")),
                     "malformed", "lineage", f"refs[{i}] malformed")
                need(ref["digest_alg"] in DIGESTS, "not-defined-in-this-version", "lineage", f"refs[{i}].digest_alg")
                p = next((x for x in parents if isinstance(x, dict) and isinstance(x.get("hdr"), dict) and x["hdr"].get("bundle_id") == ref["parent_id"]), None)
                need(p is not None, "lineage-invalid", "lineage", f"refs[{i}].parent_id does not resolve among supplied parents")
                pd = DIGESTS[ref["digest_alg"]](canon({k: v for k, v in p.items() if k != "seal"}))
                need(b64e(pd) == ref["parent_digest"], "lineage-invalid", "lineage", f"refs[{i}].parent_digest is not the digest of the resolved parent")
        # 10 boundary (out-of-bounds, indeterminate, not-defined for unknown atoms)
        bd = m.get("boundary")
        if bd is not None:
            need(atom(bd, ctx), "out-of-bounds", "boundary", "boundary predicate false for the supplied context")
        return "verified", "-", "all stages hold"
    except Stop as e:
        return e.outcome, e.stage, e.why


if __name__ == "__main__":
    V = json.load(open(sys.argv[1]))
    rows, ok = [], 0
    for v in V:
        o, st, why = verify(v["input"])
        hit = o == v["expected_outcome"]
        ok += hit
        rows.append("\t".join([v["id"], v["category"], v["expected_outcome"], o, "PASS" if hit else "FAIL", st, why.replace("\t", " ")]))
    open(sys.argv[2], "w").write("id\tcategory\texpected\tref_outcome\tmatch\tstage\twhy\n" + "\n".join(rows) + "\n")
    print(json.dumps({"vectors_sha256": hashlib.sha256(open(sys.argv[1], "rb").read()).hexdigest(), "denominator": len(V), "PASS": ok, "FAIL": len(V) - ok}))
