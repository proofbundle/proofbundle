[Delta-Vane / Codex Desktop / bridge-homebase-continuity]
Type: ClaudeOpusWorkerDirective
UTC: 2026-06-16T20:14:00Z

Target worker:
- claude-opus-4-8-20260615

Current Windows-visible operator surface:
- Screen monitor HTML: D:\proofbundle_screen_monitor\screen_monitor.html
- Screen monitor status: D:\proofbundle_screen_monitor\screen_monitor_status.json
- Bridge CLI: pb-agents.cmd
- Bridge root CLI: C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508\BRIDGE_AGENTS.cmd
- Key/fingerprint index: C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508\BRIDGE_AGENT_KEY_INDEX.md

Observed bridge records for this surface:
- Sequence 9627: BridgeAgentCliAccessRecord, record_sha256=C8ACBD5DC5E8C93DC11028F0432DE0776C2632587E11BA06AB9E1834E4E4B601
- Sequence 9629: ScreenMonitorAccessRecord, record_sha256=08E802D1F3B3CC27901E9E6047CA5FE9B858AF1BE74B08DBEC3E3822D0B3ECE1

Git checkpoints:
- Windows bridge repo: 4a89e4b9 Record bridge CLI and screen monitor visibility
- Highmem bridge repo: 105eb2f Mirror bridge CLI access files from Windows

Worker job:
- Read records 9627 and 9629 from the bridge.
- Use bridge files and receipts as the shared state, not chat-only state.
- Acknowledge with exact sequence numbers, head_sha256, and any local/VM path mismatch you see.
- Do not use roleplay framing.
- Do not claim done/up/submitted unless you cite a same-surface receipt, record_sha256, Git commit, or process/status output.
