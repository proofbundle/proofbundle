# syntax=docker/dockerfile:1
FROM rust:1.82-bookworm AS rust-build
WORKDIR /src
COPY rust/Cargo.toml rust/Cargo.lock* ./rust/
COPY rust/src ./rust/src
RUN cargo build --locked --release --manifest-path rust/Cargo.toml

FROM node:22-bookworm-slim AS web-check
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY proofbundle.html ./
COPY cli ./cli
RUN node cli/proofbundle-cli.mjs selftest

FROM debian:bookworm-slim
RUN useradd --system --uid 10001 --create-home proofbundle
COPY --from=rust-build /src/rust/target/release/proofbundle /usr/local/bin/proofbundle
WORKDIR /site
COPY --chown=proofbundle:proofbundle index.html proofbundle.html CNAME ./
COPY --chown=proofbundle:proofbundle ALGORITHM_REGISTRY.json CRYPTOGRAPHIC_SURFACE.csv ./
COPY --chown=proofbundle:proofbundle docs ./docs
USER proofbundle
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD ["/usr/local/bin/proofbundle","hash","/site/index.html"]
ENTRYPOINT ["/usr/local/bin/proofbundle"]
CMD ["serve","/site","--listen","0.0.0.0:8080"]
