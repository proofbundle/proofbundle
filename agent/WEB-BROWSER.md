# ProofBundle Web Browser Bridge

Commissioned by the operator 2026-10-02: "Build a universal ProofBundle web-bridge so
all agents can access browsers on this machine readily." Tool, not law — same standing
as the web bridge it composes with. Owner: cline lane.

## What it is

`web-browser.mjs` — 127.0.0.1-only HTTP service (default :8792) giving every agent
lane shared access to this machine's Chrome, headless, single-flight (capacity gate:
max 2 heavy workers host-wide). Every action is sealed through the web bridge's
`/seal` into the append-only hash-chained lineage (`payload_type: "browse"`), with
the acting lane's ed25519 identity — receipts return lineage seq.

## Run

```sh
node ~/src/proofbundle/agent/web-bridge.mjs   # sealing bridge, 127.0.0.1:8788
node ~/src/proofbundle/agent/web-browser.mjs  # browser layer, 127.0.0.1:8792
```

## Agent quickstart (any lane)

```sh
curl -s -X POST http://127.0.0.1:8792/browse/text \
  -H 'content-type: application/json' \
  -d '{"lane":"<your-lane>","url":"https://example.com","max":20000}'
curl -s -X POST http://127.0.0.1:8792/browse/screenshot \
  -H 'content-type: application/json' \
  -d '{"lane":"<your-lane>","url":"http://127.0.0.1:8788/","width":1280,"height":800}'
```

Actions: `/browse/text` (page text), `/browse/open` (text + raw HTML),
`/browse/screenshot` (PNG under WIN-NVME-500G/browser-bridge/shots/, sha256 sealed),
`/browse/status`. `GET /health`, `GET /` quickstart page.

## Constraints (by design)

- URL schemes http/https/data/about only. `file://` and `chrome://` refused.
- 127.0.0.1 only. Lane id required and validated (`^[a-z0-9][a-z0-9_-]{0,31}$`).
- One chrome at a time (serialized queue). Chrome profile + artifacts live on
  /media/falsealias/WIN-NVME-500G/browser-bridge/ (root disk is 98% full).
- No temp writes anywhere; screenshots are append-named, never overwritten.

## Verified first uses (2026-10-02)

- seq 476: /browse/text http://127.0.0.1:8791/ (rail panel), 18,408 bytes, sealed.
- seq 477: /browse/screenshot http://127.0.0.1:8788/ (web-bridge dashboard),
  sha256 ed844b3d8e4f28bd6fccaa0f345b634772043db884202fe49693b63c78cb52c2, sealed.
