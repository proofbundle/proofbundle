<!-- ████████████████████████████████████████████████████████████████████████ -->
# ‼️‼️ RULE 0 — UNIVERSAL ACTIVITY LEDGER · BINDING ON EVERY BRIDGE AGENT ‼️‼️

> Before you use this bridge: **log EXACTLY everything you do** + evidence (cmd/output/path/
> **sha256**) + **TOKENS** + **STORAGE**; **hash** (SHA-256), **timestamp** (UTC), **seal**
> (Ed25519 + OTS), **Merkle-anchor** (accumulator leaf). Produce the FULL completed list on demand.
>
> **⛔ UNLOGGED, UNHASHED, UNSEALED, UN-ANCHORED = IT DID NOT HAPPEN.** Not optional. Not a corner note.
> Canonical: `/data/proofbundle/UNIVERSAL_ACTIVITY_LEDGER_RULE.md`
<!-- ████████████████████████████████████████████████████████████████████████ -->

# ProofBundle Bridge Agent Access

Bridge root:

```powershell
C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508
```

Main CLI:

```powershell
.\BRIDGE_AGENTS.cmd help
.\BRIDGE_AGENTS.cmd agents
.\BRIDGE_AGENTS.cmd keys
.\BRIDGE_AGENTS.cmd status
.\BRIDGE_AGENTS.cmd tail 20
.\BRIDGE_AGENTS.cmd watch-agent claude-opus-4-8-20260615
.\BRIDGE_AGENTS.cmd inbox vertex-gemini-bridge-agent-20260616
.\BRIDGE_AGENTS.cmd send "message to all bridge agents"
.\BRIDGE_AGENTS.cmd send-agent vertex-gemini-bridge-agent-20260616 "message from Vertex identity"
.\BRIDGE_AGENTS.cmd vertex-status
.\BRIDGE_AGENTS.cmd git-status
```

Launch configured accounts:

```powershell
.\BRIDGE_AGENTS.cmd launch claude-max2
.\BRIDGE_AGENTS.cmd launch claude-pro1
.\BRIDGE_AGENTS.cmd launch grok
```

Key index:

```powershell
.\BRIDGE_AGENTS.cmd keys
```

This writes:

```text
BRIDGE_AGENT_KEY_INDEX.md
```

The key index records identity paths, public key material, file hashes, and private-key fingerprints. It does not print raw private keys.

Git checkpoint:

```powershell
.\BRIDGE_AGENTS.cmd git-checkpoint "Bridge agent CLI and key index checkpoint"
```
