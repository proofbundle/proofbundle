# Opus independent-review packet

Review status: **prepared for Opus; no Opus review result is claimed**.

Treat recorded logs as provenance, then rerun everything in a clean environment.

## 1. Establish the file baseline

```sh
sha256sum -c SHA256SUMS
sha512sum -c SHA512SUMS
```

Read `MANIFEST.json`. Its BLAKE3 commitment covers the RFC 8785 serialization of
the ordered file entries without the commitment member. The manifest and
checksum files intentionally exclude themselves.

Confirm the immutable upstream tarball:

```sh
sha256sum upstream/mc108_canonical_20260728.tar.gz
```

Expected SHA-256:
`98d6d50ce33457e678c73533df51cdcac6ca5b105bb94ea79afbf17809ce0487`.

## 2. Rebuild dependencies and execute code

```sh
npm ci --ignore-scripts
npm run check:syntax
npm run test:full
npm run reference:test
node examples/create-and-verify.mjs
node examples/hybrid-signature.mjs
node examples/encrypt-and-open.mjs
```

The recorded full matrix had 64 passing tests and no skips after the final
hybrid, timestamp, container, and profile-integration tests. The independent reference expectations
are 88/0 Keccak, 40/0 ML-KEM properties, 45/0 external-vector checks, and 30/0
fresh Node-to-pure-JS interoperability trials.

## 3. Recheck proofs

With native Coq:

```sh
cd proofs/coq
make
```

Or with JSCoq 0.17.1:

```sh
npm install --prefix /tmp/proofbundle-jscoq jscoq@0.17.1
JSCOQ=/tmp/proofbundle-jscoq/node_modules/.bin/jscoq npm run proofs:jscoq
```

Confirm all four exits are zero, 26 assumption reports say
`Closed under the global context`, and the hygiene scan has no bypass.

## 4. Review these code paths first

1. `src/canonical-cbor.mjs` and `src/canonical-json.mjs`: duplicate handling,
   minimal encodings, Unicode, integer/float restrictions, and re-encoding.
2. `src/registry.mjs`: identifier immutability, complete parameter names,
   default profiles, and status enforcement.
3. `src/signatures.mjs`: protected-header construction, TBS framing, key-ID
   binding, component order, RSA-PSS parameters, and ECDSA encoding.
4. `src/kem.mjs` and `src/encryption.mjs`: hybrid transcript, fixed component
   order, key binding, SHA-512 transcript commitment, HKDF context, KEM–DEM
   composition, and review gate.
5. `src/structures.mjs`: recursive split rule, leaf/node tags, proof-shape
   reconstruction, MMR peak ordering, chain and DAG cycle logic.
6. `src/manifest.mjs` and `src/verifier.mjs`: path/order checks, exact digest
   list, resource limits, self-asserted versus pinned keys, payload scope,
   lineage, and validated timestamp results.
7. `src/timestamp.mjs`, `src/certificates.mjs`, `src/containers.mjs`, and
   `src/providers.mjs`: ensure adapter results cannot be mistaken for trust.

## 5. Adversarial questions

- Can an unknown, legacy, or review-required identifier reach an active code
  path without the intended policy flag?
- Can one valid hybrid signature compensate for a missing, reordered, renamed,
  or invalid second component?
- Does any unsigned field select an algorithm, key, recipient, KDF context,
  Merkle interpretation, or timestamp authority?
- Can two byte encodings decode to the same accepted canonical object?
- Is the SHA-512 commitment of the full KEM transcript sufficient and placed
  correctly in both encapsulation and decapsulation?
- Does the local hybrid combiner have a defensible security argument under
  classical or PQ component failure?
- Can malformed ML-KEM ciphertext behavior leak a useful oracle through errors,
  timing, or logs?
- Can a caller cause GCM/ChaCha nonce reuse or bypass the external-nonce gate?
- Can embedded keys be confused with externally authenticated identity?
- Can raw timestamp bytes or duplicate authority labels satisfy policy?
- Can payload omission, resource exhaustion, or a missing lineage parent be
  reported as successful full verification?
- Are JavaScript and Node/OpenSSL versions acceptable under the deployment's
  side-channel, certification, and supply-chain requirements?
- Do the Coq definitions correspond to every relevant JavaScript branch?

## 6. Expected review output

Ask Opus to return:

- findings ranked critical/high/medium/low/informational;
- file and function references;
- exploit or counterexample inputs where possible;
- discrepancies between docs, tests, Coq models, and runtime behavior;
- standards/profile corrections;
- missing authoritative vectors;
- a separate assessment for primitive use, protocol composition, trust and
  identity, operational security, and admissibility;
- an explicit go/no-go recommendation for experimentation, pilot, and
  production.

Do not accept “tests pass” or “proofs compile” as a substitute for the
composition, model-correspondence, and trust-boundary review.
