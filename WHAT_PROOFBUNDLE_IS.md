# What ProofBundle is

ProofBundle is a local application for retained file bytes, signed cryptographic receipts, recipient encryption, and verifiable custody history. Its primary surface is the standalone [`proofbundle.html`](proofbundle.html), with the cryptographic source modules embedded in that file. Ordinary use requires a modern browser and local storage; it does not require a server or Node runtime.

A receipt binds a specified canonical JSON representation and artifact commitments to a signing key. Verification checks that binding under an explicit profile. The result concerns those bytes and that profile. A recorder's signature does not, by itself, establish the source author's identity, an operator's endorsement, compliance with an external legal regime, or a Bitcoin timestamp.

The browser workspace provides file sealing and verification, folder intake, retained artifacts, persistent local Ed25519 identities, local agent-session registration, and ML-KEM recipient encryption with authenticated ciphers. Registration records its actual time and supplied metadata. Missing spawn-time proof remains a provenance gap; registration does not reconstruct unavailable evidence.

The optional web bridge connects to agent identities, signed envelopes and retained relay lineage. It serves the same standalone application at `/app`, plus a companion relay console. That transport is optional. Advanced historical profiles, source archives and formal models remain inspectable, with declarations and executed evidence reported separately.

The [cryptographic basis](CRYPTOGRAPHIC_BASIS.md) identifies normative specifications, source hashes, measured conformance and necessary proof obligations. Published-vector conformance, independent interoperability, hostile-input rejection, browser diagnostics and abstract model theorems are different instruments. Passing them does not establish a blanket security proof or FIPS module certification. Implementation refinement, timing guarantees and full composition proofs remain open where the ledger says so.

Source records are preserved separately from generated summaries and receipts. Historical formal policy models establish properties of their definitions; their presence is not evidence of operator adoption or runtime enforcement. The current public claims are bounded by the [repair receipt](reports/native-repair-20261013/release-receipt.json) and its explicitly recorded limitations.
