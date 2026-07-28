# Provider specification — slice 1

**No providers are implemented in this slice.** `src/providers/*` from the
originating specification does not exist yet. This file states the intended
contract so it is fixed before any provider is written, rather than
discovered ad hoc per provider.

## The contract every future provider must expose

    providerId
    providerVersion
    capabilities()          -> list of supported operations
    supportedAlgorithms()   -> list of registry ids this provider can serve
    getPublicKey(keyId)     -> public key material, or PROVIDER_UNAVAILABLE
    sign(keyId, message)    -> signature, or PROVIDER_UNAVAILABLE
    verify(...)             -> boolean, where applicable
    encapsulate/decapsulate -> where applicable
    attestation()           -> evidence, where applicable
    // every method returns PROVIDER_UNAVAILABLE deterministically when the
    // underlying hardware/service/credential is absent — never a partial
    // or fabricated result.

## Why zero providers exist yet

Every provider named in the originating specification (TPM 2.0, Apple
Secure Enclave, Windows CNG, Android Keystore, PKCS#11, PIV, FIDO2/WebAuthn,
cloud KMS, remote signing) requires either physical hardware, an operating
system this is not running on, or live credentials to a third-party
service. This sandboxed environment has none of them
(`reports/environment-report.txt`). Writing a provider module that returns
`PROVIDER_UNAVAILABLE` for every call without ever having a real backend to
test it against would produce code with zero test coverage of its actual
purpose — not more honest than not writing it, only more voluminous.

The one exception worth building next is `src/providers/offline-provider.mjs`
(a pure-software key-file provider) and `src/providers/node-crypto-provider.mjs`,
since both are fully exercisable in this environment with Node's own
`crypto.generateKeyPair`/`sign`/`verify` — the natural next step once
`src/signature/ed25519.mjs` etc. are wired (see `IMPLEMENTATION_STATUS.md`).

**Do not extend this "genuinely unavailable" reasoning to timestamping.**
Every provider named above is unavailable because it needs *hardware this
machine doesn't have* or *a credential nobody granted*. A remote
timestamping calendar needs neither — only network reachability, which
this environment has (verified live; see `src/timestamp/`). An earlier
draft of `IMPLEMENTATION_STATUS.md` conflated the two categories and
asserted timestamping was blocked without testing it. It wasn't. Keep
these two kinds of "not done" separate: hardware/credential absence is a
hard environmental wall; network-service integration not yet attempted is
just unstarted work.
