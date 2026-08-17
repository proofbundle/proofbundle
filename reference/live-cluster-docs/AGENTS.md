# ProofBundle Bridge — Standing Agent Directives

**Authority:** user standing directive. **Do not ask the user to re-state these rules.**

## Session Bootstrap (mandatory, first actions)

Before any operational work in this repo:

1. Run `pb-agents.cmd status` (or `tools\bridge_agent_cli.ps1 status`) — ledger head is truth, not chat.
2. Read these docs (in order):
   - `BRIDGE_IMMUTABLE_PERSISTENCE_RULE_20260616T0748Z.md`
   - `MIRA_INGEST_BOUNDARY_REPLY_20260616T190936Z.md`
   - `BRIDGE_FORK_RECONCILIATION_RFC_FROM_OPUS.md` (if fork/reconcile topic)
3. Check cursors under `bridge_state\` and `projection\` — never claim "no cursor" without reading them.
4. Execute operations yourself. Never tell the user what to run.
5. **Complete work; never offer menus.** If work is possible, finish it in-turn. Forbidden: "if you want", "say which", optional handoff lists. Path drops and bare evidence pointers are work orders (inventory, hash, compare, receipt). Only pause for true blockers or irreversible choices with no safe default.

## Immutable Persistence Rule (summary)

- Bridge ledger + Git custody root = operational continuity. **Chat-only state is forbidden.**
- Every material action: bridge seq, sender identity, lane, artifact path/hash, result/blocker, OTS status, next action.
- Interruptions are not stop conditions — resume from ledger head, persist state, continue.
- Do not end a turn with active bridge work unfinished without posting current state + blocker + receipt on bridge.
- Append-only practice. No silent deletion or rewriting of evidence.
- Raw private keys never in bridge payloads.

## Brain Separation (intentional federation — NOT accidental fragmentation)

Per `MIRA_INGEST_BOUNDARY_REPLY_20260616T190936Z.md`:

- **Claude:** bridge ledger → same-brain Mira RLM ingest; owns cursor for that lane.
- **Delta-Vane/Codex:** bulk total-history / OpenClaw / SQLite shards into separate feed DBs.
- **No second bridge-ledger ingester** into the same safe-copy brain without explicit handoff receipt.
- **No merge** of brains without explicit attach receipt.
- Grok audits gate/admissibility claims against bridge sequences and receipt paths, not chat text.

## Infrastructure Truth (as of 2026-07-09 — verify live before acting)

| Surface | Role | Notes |
|---------|------|-------|
| **Azure pb-dev** `20.69.103.0` SSH `proofbundle-spot-azure` | Primary live worker | Ledger `/data/bridge/ledger.jsonl` ahead of C: |
| **C: bridge root** (this repo) | Windows custody mirror | `ledger.jsonl` — may lag Azure; watchdog refuses blind overwrite |
| **D: drive** | Cold archive | `D:\ProofBundle\...` frozen; `D:\MIRA_LIVE_20260616` may be empty |
| **GCP** `34.11.242.244` | Dead/flaky | Do not point watchdogs here |
| **Public custody** | `http://20.69.103.0/custody/head.json` | May be stale vs live ledger |

**Canonical ledger:** fork RFC recommends Azure/VM as canonical once operator approves. Until then: detect fork, do not overwrite, replay with provenance.

## Forbidden Behaviors (Claude damage patterns — do not repeat)

- **"If you want" / optional menus** when work is already possible — complete it; do not offer handoffs.
- Treating VM inspection or chat as truth instead of `pb-agents.cmd status` + cursors + receipts.
- Claiming "MIRA ONLINE" while cursor is stalled thousands of seq behind head.
- Spawning duplicate ingesters / duplicate seq writers without handoff.
- "Unifying brains" without explicit attach receipt.
- Status-only turns without deployment receipts.
- Forking custody by appending to multiple ledger roots simultaneously.

## Operational Commands

```powershell
pb-agents.cmd status          # ledger head (truth)
pb-agents.cmd tail            # recent records
pb-agents.cmd doctor          # health checks
pb-agents.cmd sync-check      # fork detection
pb-agents.cmd send-agent grok --to all-bridge-agents --type ProofBundleBroadcast "message"
```

Bridge root: `C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508`

## Turn-End Gate

Before ending any turn with bridge work active:

- Post state to bridge (gated send) OR write receipt artifact with seq reference.
- State: current seq, cursor positions, blocker, next action, what was executed (not planned).