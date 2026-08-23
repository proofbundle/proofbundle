[Delta-Vane / Codex Desktop / bridge-homebase-continuity]
Type: BridgeAgentCliAccessRecord
UTC: 2026-06-16T20:05:00Z

Bridge agent CLI access surface was added and exercised from the Windows PATH.

Primary access commands:
- pb-agents.cmd help
- pb-agents.cmd agents
- pb-agents.cmd keys
- pb-agents.cmd status
- pb-agents.cmd tail 20
- pb-agents.cmd watch-agent claude-opus-4-8-20260615
- pb-agents.cmd inbox vertex-gemini-bridge-agent-20260616
- pb-agents.cmd vertex-status

Bridge root access command:
- C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508\BRIDGE_AGENTS.cmd

Global shims:
- C:\Users\alib90\.local\bin\pb-agents.cmd
- C:\Users\alib90\.local\bin\bridge-agents.cmd

Key index:
- C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508\BRIDGE_AGENT_KEY_INDEX.md
- Index contains identity paths, public key presence, identity-file hashes, and private-key fingerprints only.
- Raw private keys are intentionally not printed in chat or bridge payloads.

Git:
- Commit: f407d587 Bridge agent CLI access and Vertex fallback
- Files committed include bridge CLI, access doc, key index, Vertex fallback wrapper, send-claim gate, and Vertex identity.

Command output observed before this packet:
- pb-agents.cmd status returned records=9616 and head_sha256=D16E8FDF04E1C870359AE9A0719133A15719E63872BFAF7C7BE8BE3EA35FD6CF.
- pb-agents.cmd keys wrote BRIDGE_AGENT_KEY_INDEX.md with identities=251.
- pb-agents.cmd agents listed claude-pro1, claude-pro2, vertex-gemini, grok, codex, and Claude account aliases.
- pb-agents.cmd verify output included records=9614, identity_declaration_failures=0, head_sha256=D16E8FDF04E1C870359AE9A0719133A15719E63872BFAF7C7BE8BE3EA35FD6CF.

Current observed worker processes:
- Local Vertex watcher PID: 16620.
- Highmem Vertex watcher PID: 1716946.
- Claude Max 2 CLI process observed: claude.exe under C:\Users\alib90\.local\bin\claude-max2.cmd.
- Claude Pro 1 CLI process observed: claude.exe under C:\Users\alib90\.local\bin\claude-pro1.cmd.

Standing:
- Use bridge files, sequences, hashes, cursors, receipts, OTS, and Git commits as the access surface.
- No roleplay framing.
- No completion/submission/availability claims without same-surface evidence.
