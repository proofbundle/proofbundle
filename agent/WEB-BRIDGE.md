# ProofBundle Web Bridge

Commissioned by the operator 2026-10-01: "build a sealing proofbundle web
bridge for all of the agents on this machine." It is a **bridge**, not a
"broker", and it is a **tool, not a law** — no hooks, no prompt injection,
nothing is routed through it unless an agent (or the operator) chooses to.

## What it is

`web-bridge.mjs` — a 127.0.0.1-only HTTP service + dashboard. It imports the
library exports of `bridge.mjs` (left importable per the 2026-09-23 revocation
addendum), so sealing is exactly how it always ran:

- Ed25519 identity per agent (keys 0600 under `~/.proofbundle/agent/<id>/`),
  X25519 encryption keys, ML-KEM-768 PQ keys where keygen is available
- sealed envelopes (`PB-AGENT-1`): canonical-JSON payload, SHA-256 plaintext
  hash, signature covers seq + prev_hash assigned from the chain tip
- append-only hash-chained lineage (`~/.proofbundle/bridge/lineage.jsonl`),
  advisory O_EXCL append lock, fork detection (tips + duplicate seqs)
- RFC 6962 Merkle batching (domain-separated leaves/nodes, no odd-node
  duplication) with OTS states pending → submitted → upgraded (successful detached Bitcoin verification required)
- agent-to-agent routing via per-agent inboxes; encrypted envelopes seal
  per-recipient and are refused by /route (ciphertext is recipient-bound)

The guarded pre-revocation entrypoints (`bin/agent-bridge.mjs`, direct
`node bridge.mjs`) are untouched and still exit 81.

## Application and recorder

`GET /app` and `GET /proofbundle.html` serve the same standalone HTML shipped in the repository. Ordinary file custody, recipient encryption and local agent registration work without this service. The bridge console is an optional connection to retained relay state. Crypto computation uses the scratch providers; Node supplies HTTP and filesystem transport only.

## Run

```sh
node ~/src/proofbundle/agent/web-bridge.mjs            # default port 8788
node ~/src/proofbundle/agent/web-bridge.mjs --port 8790
PB_AGENT_BRIDGE_PORT=8790 node ~/src/proofbundle/agent/web-bridge.mjs
```

Dashboard: <http://127.0.0.1:8788/> — overview pills (chain/fork/seq),
registered agents + known launchers, seal console, verify console,
lineage tail, inbox fetch, stamp.

A user unit is provided at `agent/proofbundle-web-bridge.service` — install
and enable it yourself if you want it persistent; nothing auto-starts it.

## Endpoints

Historical (delegated unchanged to the library handler):
`POST /register` `{agent_id, aibom?}` · `POST /seal` `{agentId, payloadType,
payload, to?, encrypt?, prediction?}` · `POST /verify` `{envelope}` ·
`POST /route` `{to, envelope}` · `GET /inbox/:id` (fetch+clears) ·
`GET /lineage` · `GET /lineage/export` (full log + fork check; the real log
is tens of MB) · `GET /identity/:id` · `GET /predict/:seq` ·
`GET /proof/:seq` (Merkle inclusion proof over the open batch) ·
`POST /resolve` · `POST /stamp` · `POST /ots-check` · `GET /health`

Added by the web bridge (read-only, additive):
`GET /` dashboard · `GET /api/overview` · `GET /api/agents` (registry +
launchers from the proofbundle-agents VS Code extension) ·
`GET /api/lineage/tail?n=50` (mtime-cached; does not ship the whole log) ·
`GET /api/identity/:id`

## Agent quickstart (any agent on this machine)

```sh
B=http://127.0.0.1:8788
curl -s -X POST $B/register -H 'content-type: application/json' \
  -d '{"agent_id":"kimi"}'
curl -s -X POST $B/seal -H 'content-type: application/json' \
  -d '{"agentId":"kimi","payloadType":"work","payload":{"note":"hello"}}'
# -> receipt: { seq, envelope_hash, signature_valid: true }
```

## Fixes shipped with the web bridge (2026-10-01)

`bridge.mjs` `inclusionProof()` and `stamp()` used raw `envelopeHash()` where
the Merkle tree is built over domain-separated `hashLeaf()` values — so every
`/proof/:seq` returned `proof_valid: false` and batch `leaf_hashes` did not
hash up to `merkle_root`. Both now use the tree leaves from
`merkleRoot().leaves`. Verified: proof over a 3-envelope open batch returns
`proof_valid: true`, and an independent Python RFC 6962 recomputation from a
stamped batch's `leaf_hashes` reproduces its `merkle_root`. Historical batch
files still carry the old (wrong) leaf_hashes; recompute from the lineage if
ever needed — their `merkle_root` values were always correct.

## Storage policy

State stays where it always lived: `~/.proofbundle/{bridge,agent}` (home
disk). Nothing here writes to `/tmp`, `/mnt/pb-work`, `/dev/shm`, `/var/tmp`.
