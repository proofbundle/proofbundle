# ProofBundle native CLI

The Rust implementation provides streaming SHA-256 custody hashes, deterministic
directory indexes, index verification, algorithm-registry structural checks, and
the production static-file runtime used by the container image.

```sh
cargo run --manifest-path rust/Cargo.toml -- selftest
cargo run --manifest-path rust/Cargo.toml -- index ./artifacts --out custody.json
cargo run --manifest-path rust/Cargo.toml -- verify-index custody.json --root ./artifacts
cargo run --manifest-path rust/Cargo.toml -- registry ALGORITHM_REGISTRY.json
cargo run --manifest-path rust/Cargo.toml -- serve . --listen 127.0.0.1:8080
```

The browser engine remains the complete signing and certification surface. The
native CLI owns artifact streaming, catalog production and verification, registry
auditing, and container serving without reimplementing browser-only key custody.
