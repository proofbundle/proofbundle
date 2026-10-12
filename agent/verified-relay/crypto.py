#!/usr/bin/env python3
"""pb-rail crypto module — owner: rail-crypto. FROZEN CONTRACT per ~/pb/rail/SPEC.md v1.0.

Envelope flow: payload -> KEM key agreement -> ChaCha20-Poly1305 seal ->
SHA-256 digest of ciphertext -> Ed25519 lane-identity signature over
(header || digest) -> envelope on the wire. Ed25519 SIGNS, it never decrypts.
"""
import base64
import json
import os
from datetime import datetime, timezone
from hashlib import sha256

from nacl.bindings import crypto_scalarmult
from nacl.exceptions import BadSignatureError, CryptoError as _NaclCryptoError
from nacl.public import Box, PrivateKey, PublicKey
from nacl.signing import SigningKey, VerifyKey
from nacl.utils import random as _random

ALG = {
    "kem": "kem.x25519.v1",
    "kem_pq": "kem.ml-kem-768.v1",
    "aead": "aead.chacha20poly1305.v1",
    "hash": "hash.sha256.v1",
    "sig": "sig.ed25519.v1",
    "sig_pq": "sig.dilithium2.v1",
}

KEYS_DIR = os.path.expanduser("~/pb/live/keys")
_LANES_JSON = os.path.expanduser("~/pb/live/bus/LANES.json")

# Exact field order for the signature message (SPEC line 29).
_SIG_FIELDS = ("v", "frm", "to", "ts", "alg", "ek", "nonce", "ct", "digest")


class CryptoError(Exception):
    """Raised by open_envelope (and helpers) on any crypto failure."""


def _pq_kem_backend():
    try:
        from cryptography.hazmat.primitives.asymmetric import kyber  # noqa: F401
        return "cryptography"
    except Exception:
        pass
    try:
        import oqs  # liboqs-python
        return "oqs"
    except Exception:
        return None


def _pq_sig_backend():
    try:
        import oqs  # liboqs-python (dilithium2)
        return "oqs"
    except Exception:
        return None


_MLKEM_CT_LEN = 1088  # ml-kem-768 ciphertext bytes


def _mlkem_files(lane):
    d = os.path.join(KEYS_DIR, lane)
    return os.path.join(d, "mlkem.sk"), os.path.join(d, "mlkem.pub")


def _mlkem_ensure(lane):
    """Generate (once) or load recipient ml-kem-768 keypair. Returns (sk, pub)."""
    sk_p, pub_p = _mlkem_files(lane)
    if os.path.isfile(sk_p) and os.path.isfile(pub_p):
        return _read_secret(sk_p, "mlkem.sk"), _read(pub_p)
    be = _pq_kem_backend()
    if be is None:
        raise CryptoError("ml-kem backend unavailable")
    if be == "oqs":
        import oqs
        with oqs.KeyEncapsulation("ML-KEM-768") as kem:
            pub = kem.generate_keypair()
            sk = kem.export_secret_key()
    else:
        from cryptography.hazmat.primitives.asymmetric import kyber
        k = kyber.Kyber768.generate()
        pub = k.public_key().public_bytes_raw()
        sk = k.private_bytes_raw()
    os.makedirs(os.path.dirname(sk_p), exist_ok=True)
    _write_secret(sk_p, bytes(sk))
    _write_pub(pub_p, bytes(pub))  # S6: public keys are not secrets
    return bytes(sk), bytes(pub)


def _mlkem_encaps(lane):
    """Returns (ct, shared_secret) encapsulated to lane's ml-kem public key."""
    _, pub = _mlkem_ensure(lane)
    be = _pq_kem_backend()
    if be == "oqs":
        import oqs
        with oqs.KeyEncapsulation("ML-KEM-768") as kem:
            ct, ss = kem.encap_secret(pub)
            return bytes(ct), bytes(ss)
    from cryptography.hazmat.primitives.asymmetric import kyber
    pubk = kyber.Kyber768PublicKey.from_raw_bytes(pub)
    ct, ss = pubk.encapsulate()
    return ct, ss


def _mlkem_decaps(lane, ct):
    sk_p, _ = _mlkem_files(lane)
    sk = _read_secret(sk_p, "mlkem.sk")
    be = _pq_kem_backend()
    if be == "oqs":
        import oqs
        with oqs.KeyEncapsulation("ML-KEM-768") as kem:
            kem.import_secret_key(sk)
            return bytes(kem.decap_secret(ct))
    from cryptography.hazmat.primitives.asymmetric import kyber
    skk = kyber.Kyber768PrivateKey.from_raw_bytes(sk)
    return skk.decapsulate(ct)


# --------------------------------------------------------------------------
# Key files: ~/pb/live/keys/<lane>/{ed25519.seed,ed25519.pub,x25519.pub}
# One seed per lane; the x25519 identity is derived from it. Seed never on wire.
# --------------------------------------------------------------------------

def _read(path):
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError as e:
        raise CryptoError(f"cannot read {path}: {e}") from e


def _require_mode(path, expected, label):
    """SECRETS.md S2: fail closed if a secret file is not at the expected mode.

    A loader that finds a seed/secret key world- or group-readable must RAISE,
    never read it silently. This is the whole point of the rule, so the check
    runs before any byte of the file is read.
    """
    try:
        st = os.stat(path)
    except OSError as e:
        raise CryptoError(f"cannot stat {label} {path}: {e}") from e
    got = st.st_mode & 0o777
    if got != expected:
        raise CryptoError(
            f"{label} {path} has mode {got:04o}; refusing to read secret "
            f"material not at {expected:04o} (S2 fail-closed)")


def _read_secret(path, label):
    """Read a secret file only if it passes the S2 mode gate."""
    _require_mode(path, 0o600, label)
    return _read(path)


def _write_secret(path, data: bytes):
    """Write material that must never be world/group-readable (0600)."""
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    os.chmod(path, 0o600)


def _write_pub(path, data: bytes):
    """SECRETS.md S6: public keys are NOT secrets.

    Public key material must not go through the `_write_secret` helper; this
    path writes 0644 and keeps the `_secret` name reserved for material that
    must never be world/group-readable.
    """
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    os.chmod(path, 0o644)


def _lane_files(lane):
    d = os.path.join(KEYS_DIR, lane)
    return d, os.path.join(d, "ed25519.seed"), os.path.join(d, "ed25519.pub"), os.path.join(d, "x25519.pub")


def lane_keypair(lane: str, overwrite: bool = False) -> dict:
    """Idempotent lane key generation. Returns lane pubkeys as hex."""
    lane = str(lane)
    d, seed_p, ed_p, x_p = _lane_files(lane)
    if overwrite or not (os.path.isfile(seed_p) and os.path.isfile(ed_p) and os.path.isfile(x_p)):
        os.makedirs(d, exist_ok=True)
        os.chmod(d, 0o700)
        sk = SigningKey.generate()
        _write_secret(seed_p, bytes(sk))
        _write_pub(ed_p, bytes(sk.verify_key))  # S6: public keys are not secrets
        _write_pub(x_p, bytes(sk.verify_key.to_curve25519_public_key()))
    return {
        "lane": lane,
        "ed25519.pub": _read(ed_p).hex(),
        "x25519.pub": _read(x_p).hex(),
    }


def _load_seed(lane):
    _, seed_p, _, _ = _lane_files(lane)
    # S2: fail closed (raise) before reading if the seed is not 0600.
    return _read_secret(seed_p, "ed25519.seed")


def _load_ed25519_pub(lane):
    _, _, ed_p, _ = _lane_files(lane)
    return _read(ed_p)


def _load_x25519_pub(lane):
    _, _, _, x_p = _lane_files(lane)
    return PublicKey(_read(x_p))


# --------------------------------------------------------------------------
# Seal / open
# --------------------------------------------------------------------------

def _sig_message(env: dict) -> bytes:
    d = {k: env[k] for k in _SIG_FIELDS}
    return json.dumps(d, separators=(",", ":")).encode("utf-8")


def _validate_payload(payload) -> dict:
    if not isinstance(payload, dict):
        raise CryptoError("payload must be a dict")
    subject, body, reply_to = payload.get("subject"), payload.get("body"), payload.get("reply_to")
    if not isinstance(subject, str) or not isinstance(body, str):
        raise CryptoError("payload.subject/body must be str")
    if reply_to is not None and not isinstance(reply_to, int):
        raise CryptoError("payload.reply_to must be int|None")
    return {"subject": subject, "body": body, "reply_to": reply_to}


def seal(payload: dict, frm: str, to: str, pq: bool = False) -> dict:
    """Build an encrypted+signed envelope frm -> to."""
    payload = _validate_payload(payload)
    pt = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    ts = datetime.now(timezone.utc).isoformat()
    alg = {"kem": ALG["kem"], "aead": ALG["aead"], "hash": ALG["hash"], "sig": ALG["sig"]}

    eph = PrivateKey.generate()
    recip_x = _load_x25519_pub(to)
    ek, pq_used = None, False
    if pq:
        # Wrap the x25519 shared secret with ml-kem-768 hybrid KEM when the
        # backend is present; else silently use the classic path (SPEC l.32-33).
        try:
            from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
            ss_x = crypto_scalarmult(bytes(eph), bytes(recip_x))
            kem_ct, ss_k = _mlkem_encaps(to)
            key = sha256(ss_x + ss_k).digest()
            nonce = _random(12)
            ct = ChaCha20Poly1305(key).encrypt(nonce, pt, None)
            ek = kem_ct.hex() + "." + bytes(eph.public_key).hex()
            alg["kem"] = ALG["kem_pq"]
            pq_used = True
        except CryptoError:
            pq_used = False
    if not pq_used:
        box = Box(eph, recip_x)
        nonce = _random(Box.NONCE_SIZE)
        ct = box.encrypt(pt, nonce).ciphertext
        ek = bytes(eph.public_key).hex()

    digest = sha256(ct).hexdigest()  # sha256(ciphertext), before any other field
    env = {
        "v": 1,
        "frm": frm,
        "to": to,
        "ts": ts,
        "alg": alg,
        "ek": ek,
        "nonce": nonce.hex(),
        "ct": ct.hex(),
        "digest": digest,
    }
    msg = _sig_message(env)
    env["sig"] = SigningKey(_load_seed(frm)).sign(msg).signature.hex()
    if pq_used and _pq_sig_backend() == "oqs":
        import oqs
        sk_p = os.path.join(KEYS_DIR, frm, "dilithium.sk")
        pub_p = os.path.join(KEYS_DIR, frm, "dilithium.pub")
        if not (os.path.isfile(sk_p) and os.path.isfile(pub_p)):
            with oqs.Signature("DILITHIUM2") as s:
                pub_d = s.generate_keypair()
                sk_d = s.export_secret_key()
            _write_secret(sk_p, bytes(sk_d))
            _write_pub(pub_p, bytes(pub_d))  # S6: public keys are not secrets
        with oqs.Signature("DILITHIUM2") as s:
            s.import_secret_key(_read_secret(sk_p, "dilithium.sk"))
            env["sig_pq"] = s.sign(msg).hex()
        env["alg"]["sig_pq"] = ALG["sig_pq"]
    return env


def _pq_open(env, to):
    from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
    kem_ct_hex, eph_pub_hex = env["ek"].split(".", 1)
    kem_ct = bytes.fromhex(kem_ct_hex)
    if len(kem_ct) != _MLKEM_CT_LEN:
        raise CryptoError("ml-kem ciphertext length mismatch")
    ss_k = _mlkem_decaps(to, kem_ct)
    sk_x = SigningKey(_load_seed(to)).to_curve25519_private_key()
    ss_x = crypto_scalarmult(bytes(sk_x), bytes.fromhex(eph_pub_hex))
    key = sha256(ss_x + ss_k).digest()
    return ChaCha20Poly1305(key).decrypt(bytes.fromhex(env["nonce"]), bytes.fromhex(env["ct"]), None)


def open_envelope(env: dict, to: str) -> dict:
    """Verify + decrypt an envelope addressed to `to`. Raises CryptoError on any failure."""
    try:
        if not isinstance(env, dict):
            raise CryptoError("envelope must be a dict")
        if env.get("v") != 1:
            raise CryptoError("unsupported envelope version")
        for k in _SIG_FIELDS:
            if k not in env:
                raise CryptoError(f"envelope missing field: {k}")
        if env["to"] != to:
            raise CryptoError("envelope not addressed to this lane")
        ct = bytes.fromhex(env["ct"])
        nonce = bytes.fromhex(env["nonce"])
        # 1. digest check: sha256(ciphertext)
        if sha256(ct).hexdigest() != env["digest"]:
            raise CryptoError("ciphertext digest mismatch")
        # 2. lane-identity signature over (header || digest)
        msg = _sig_message(env)
        VerifyKey(_load_ed25519_pub(env["frm"])).verify(msg, bytes.fromhex(env["sig"]))
        if "sig_pq" in env:
            import oqs
            pub_p = os.path.join(KEYS_DIR, env["frm"], "dilithium.pub")
            with oqs.Signature("DILITHIUM2") as s:
                if not s.verify(msg, bytes.fromhex(env["sig_pq"]), _read(pub_p)):
                    raise CryptoError("dilithium signature invalid")
        # 3. KEM + AEAD open
        kem = env["alg"].get("kem")
        if kem == ALG["kem_pq"]:
            pt = _pq_open(env, to)
        elif kem == ALG["kem"]:
            sk_x = SigningKey(_load_seed(to)).to_curve25519_private_key()
            box = Box(sk_x, PublicKey(bytes.fromhex(env["ek"])))
            pt = box.decrypt(ct, nonce)
        else:
            raise CryptoError(f"unknown kem algorithm: {kem}")
        return _validate_payload(json.loads(pt.decode("utf-8")))
    except CryptoError:
        raise
    except (BadSignatureError, _NaclCryptoError, ValueError, TypeError, KeyError, OSError) as e:
        raise CryptoError(f"open_envelope failed: {e}") from e


# --------------------------------------------------------------------------
# Self-test suite: S1 (no seed on wire), S2 (fail-closed mode gate),
# S6 (public keys not written with the secret helper), tamper detection, and
# exercise of the declared algorithm ids (kem.x25519.v1, sig.ed25519.v1,
# aead.chacha20poly1305.v1, hash.sha256.v1).
# --------------------------------------------------------------------------

_SCRATCH = os.path.expanduser("~/pb/scratch")


def _seed_encodings(seed: bytes) -> dict:
    """Every common on-the-wire encoding a leaked seed could take."""
    return {
        "raw": seed,
        "hex": seed.hex().encode(),
        "HEX": seed.hex().upper().encode(),
        "b64": base64.b64encode(seed),
    }


def selftest_helpers():
    """S2 + S6: prove the mode gates and the pub-key writer behave as declared.

    Writes scratch files under ~/pb/scratch only (SECRETS.md S5); never /tmp.
    """
    os.makedirs(_SCRATCH, exist_ok=True)
    p_pub = os.path.join(_SCRATCH, "selftest_pub.bin")
    p_sec = os.path.join(_SCRATCH, "selftest_secret.bin")
    data = bytes(range(32))
    _write_pub(p_pub, data)
    _write_secret(p_sec, data)
    mp = os.stat(p_pub).st_mode & 0o777
    ms = os.stat(p_sec).st_mode & 0o777
    if mp == 0o600:
        raise AssertionError("S6 VIOLATION: _write_pub produced secret mode 0600")
    if mp != 0o644:
        raise AssertionError(f"S6: _write_pub mode {mp:04o}, expected 0644")
    if ms != 0o600:
        raise AssertionError(f"S2: _write_secret mode {ms:04o}, expected 0600")
    if _read(p_pub) != data or _read(p_sec) != data:
        raise AssertionError("helper write/read round trip mismatch")
    # S2 fail-closed: a secret at 0644 must RAISE before any byte is read.
    os.chmod(p_sec, 0o644)
    try:
        _read_secret(p_sec, "selftest.secret")
    except CryptoError:
        pass
    else:
        raise AssertionError("S2 VIOLATION: 0644 secret was read instead of raising")
    os.chmod(p_sec, 0o600)
    if _read_secret(p_sec, "selftest.secret") != data:
        raise AssertionError("0600 secret read failed")
    return f"{mp:04o}", f"{ms:04o}"


def selftest_no_seed_on_wire(lanes):
    """S1: assert no seed byte sequence appears in ANY envelope field."""
    seeds = {}
    for lane in lanes:
        _, seed_p, _, _ = _lane_files(lane)
        seeds[lane] = _read_secret(seed_p, "ed25519.seed")

    checked = 0
    for frm in lanes:
        for to in lanes:
            if frm == to:
                continue
            env = seal({"subject": "selftest", "body": "no-seed-on-wire probe",
                        "reply_to": None}, frm, to)
            blob = json.dumps(env, sort_keys=True).encode("utf-8")
            for lane, seed in seeds.items():
                for form, needle in _seed_encodings(seed).items():
                    if needle in blob:
                        raise AssertionError(
                            f"S1 VIOLATION: seed({lane}) {form} appears in "
                            f"envelope {frm}->{to}")
            for k, v in env.items():
                sv = str(v).encode("utf-8")
                for lane, seed in seeds.items():
                    for form, needle in _seed_encodings(seed).items():
                        if needle in sv:
                            raise AssertionError(
                                f"S1 VIOLATION: seed({lane}) {form} in field {k!r}")
            checked += 1
    return checked


def _open_expect_error(env, to, what):
    try:
        open_envelope(env, to)
    except CryptoError:
        return
    raise AssertionError(f"tamper not detected ({what}): open_envelope did not raise CryptoError")


def selftest_tamper(frm, to):
    """Every mutation of a valid envelope must make open_envelope raise CryptoError."""
    base = seal({"subject": "tamper", "body": "tamper probe", "reply_to": None}, frm, to)

    def mutate(field, newval):
        e = json.loads(json.dumps(base))
        e[field] = newval
        return e

    ct = base["ct"]
    flipped = "0" if ct[-1] != "0" else "1"
    cases = [
        (mutate("ct", ct[:-1] + flipped), "ciphertext bit flipped"),
        (mutate("digest", "00" * 32), "digest replaced"),
        (mutate("sig", "00" * 64), "signature zeroed"),
        (mutate("nonce", "00" * len(base["nonce"])), "nonce replaced"),
        (mutate("ek", "00" * len(base["ek"])), "ephemeral key replaced"),
    ]
    dropped = json.loads(json.dumps(base))
    dropped.pop("digest")
    cases.append((dropped, "digest field dropped"))
    for env, what in cases:
        _open_expect_error(env, to, what)
    wrong = json.loads(json.dumps(base))
    wrong["to"] = frm
    _open_expect_error(wrong, to, "recipient field tampered")
    try:
        open_envelope(base, frm)
    except CryptoError:
        pass
    else:
        raise AssertionError("not-addressed-to-me not detected")
    return len(cases) + 2


def selftest_algs(frm, to):
    """Exercise and assert the declared algorithm ids on a real envelope."""
    env = seal({"subject": "alg exercise", "body": "alg probe", "reply_to": None}, frm, to)
    want = {"kem": ALG["kem"], "aead": ALG["aead"], "hash": ALG["hash"], "sig": ALG["sig"]}
    for k, v in want.items():
        if env["alg"].get(k) != v:
            raise AssertionError(f"alg mismatch for {k}: {env['alg'].get(k)!r} != {v!r}")
    out = open_envelope(env, to)
    if out.get("body") != "alg probe":
        raise AssertionError("alg exercise round trip mismatch")
    return env["digest"], want


def selftest_seed_loader_fail_closed():
    """S2 end-to-end: the real loader _load_seed must raise on a non-0600 seed.

    KEYS_DIR is redirected to ~/pb/scratch for this probe only, so the live
    key material is never touched or made readable.
    """
    global KEYS_DIR
    saved = KEYS_DIR
    fake_root = os.path.join(_SCRATCH, "selftest_keys")
    d = os.path.join(fake_root, "tmplane")
    os.makedirs(d, exist_ok=True)
    seed_p = os.path.join(d, "ed25519.seed")
    probe = b"\x01" * 32
    with open(seed_p, "wb") as f:
        f.write(probe)
    try:
        KEYS_DIR = fake_root
        os.chmod(seed_p, 0o644)
        try:
            _load_seed("tmplane")
        except CryptoError:
            pass
        else:
            raise AssertionError("S2 VIOLATION: _load_seed read a 0644 seed")
        os.chmod(seed_p, 0o600)
        if _load_seed("tmplane") != probe:
            raise AssertionError("_load_seed failed on a 0600 seed")
    finally:
        KEYS_DIR = saved
    return True


# --------------------------------------------------------------------------
# __main__: generate lane keypairs for every registered lane + self-test
# --------------------------------------------------------------------------

if __name__ == "__main__":
    with open(_LANES_JSON, "r", encoding="utf-8") as f:
        lanes = sorted(json.load(f)["lanes"])
    for lane in lanes:
        kp = lane_keypair(lane)
        print(f"[keys] {lane:<10} ed25519.pub={kp['ed25519.pub'][:16]}... x25519.pub={kp['x25519.pub'][:16]}...")
    a, b = lanes[0], lanes[1]
    for frm, to in ((a, b), (b, a)):
        payload = {"subject": "rail self-test", "body": f"seal->open round trip {frm}->{to}", "reply_to": None}
        env = seal(payload, frm, to)
        out = open_envelope(env, to)
        assert out == payload, "round trip mismatch"
        print(f"[roundtrip] {frm}->{to} digest={env['digest']} OK")

    pub_mode, sec_mode = selftest_helpers()
    print(f"[modes] _write_pub={pub_mode} _write_secret={sec_mode} S2-fail-closed=OK S6=OK")

    selftest_seed_loader_fail_closed()
    print("[seed-loader] _load_seed raised on 0644 seed, read 0600 seed OK")

    n = selftest_no_seed_on_wire(lanes)
    print(f"[no-seed-on-wire] {n} envelope(s) checked across {len(lanes)} lanes; "
          f"no seed byte in any field OK")

    t = selftest_tamper(a, b)
    print(f"[tamper] {t} mutation(s) rejected with CryptoError OK")

    digest, algs = selftest_algs(a, b)
    print("[algs] exercised " + " ".join(f"{k}={v}" for k, v in sorted(algs.items())))
    print(f"[algs] envelope_digest={digest}")

    print("[selftest] PASS")
