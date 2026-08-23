[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('help','agents','keys','status','verify','tail','watch','watch-agent','inbox','send','send-agent','launch','vertex-status','vertex-start','git-status','git-checkpoint')]
  [string]$Command = 'help',

  [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = 'Stop'

$BridgeRoot = 'C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508'
$Bridge = Join-Path $BridgeRoot 'proofbundle_peer_bridge.mjs'
$DeltaCli = Join-Path $BridgeRoot 'tools\delta_vane_bridge_cli.ps1'
$LaunchAgent = Join-Path $BridgeRoot 'tools\launch_bridge_agent.ps1'
$KeyIndex = Join-Path $BridgeRoot 'BRIDGE_AGENT_KEY_INDEX.md'
$RegistryPath = Join-Path $BridgeRoot 'bridge_agents.json'
$NotifyDir = Join-Path $BridgeRoot 'bridge_notifications'

function Invoke-Bridge {
  param([string[]]$BridgeArgs)
  Push-Location -LiteralPath $BridgeRoot
  try {
    & node $Bridge @BridgeArgs
    if ($LASTEXITCODE -ne 0) { throw "bridge command failed: node $Bridge $($BridgeArgs -join ' ')" }
  } finally {
    Pop-Location
  }
}

function Invoke-DeltaCli {
  param([string[]]$CliArgs)
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $DeltaCli @CliArgs
  if ($LASTEXITCODE -ne 0) { throw "delta bridge cli failed: $($CliArgs -join ' ')" }
}

function Get-IdentityFile {
  param([string]$Identity)
  $path = Join-Path $BridgeRoot "bridge_identities\$Identity.identity.json"
  if (-not (Test-Path -LiteralPath $path)) { throw "identity file not found: $path" }
  return $path
}

function Show-Help {
  Write-Host 'ProofBundle bridge agent CLI'
  Write-Host ''
  Write-Host 'Root command: BRIDGE_AGENTS.cmd <command> [args]'
  Write-Host ''
  Write-Host 'Core:'
  Write-Host '  agents                         List configured account aliases and active agent processes'
  Write-Host '  keys                           Generate/read BRIDGE_AGENT_KEY_INDEX.md'
  Write-Host '  status                         Show bridge status'
  Write-Host '  verify                         Verify bridge ledger'
  Write-Host '  tail [n]                       Show recent records'
  Write-Host '  watch                          Watch all new bridge records'
  Write-Host '  watch-agent <identity>         Watch records for an identity'
  Write-Host '  inbox <identity>               Pull inbox for identity'
  Write-Host ''
  Write-Host 'Send/launch:'
  Write-Host '  send <text>                    Delta-Vane sends to all-bridge-agents with Tor/OTS'
  Write-Host '  send-agent <identity> <text>   Send as identity to all-bridge-agents'
  Write-Host '  launch <alias> [count]         Launch configured account alias with bridge prompt'
  Write-Host ''
  Write-Host 'Vertex/Git:'
  Write-Host '  vertex-status                  Show local and highmem Vertex watcher status'
  Write-Host '  vertex-start                   Start local Vertex watcher'
  Write-Host '  git-status                     Show bridge Git status'
  Write-Host '  git-checkpoint [message]       Commit staged bridge-access changes'
  Write-Host ''
  Write-Host "Bridge root: $BridgeRoot"
}

function Show-Agents {
  $registry = Get-Content -LiteralPath $RegistryPath -Raw | ConvertFrom-Json
  $accounts = $registry.accounts.PSObject.Properties | ForEach-Object {
    [pscustomobject]@{
      Alias = $_.Name
      Kind = $_.Value.kind
      DisplayName = $_.Value.display_name
      Command = $_.Value.command
      ConfigDir = $_.Value.config_dir
    }
  }
  Write-Host 'Configured aliases:'
  $accounts | Format-Table -AutoSize
  Write-Host ''
  Write-Host 'Active bridge-related processes:'
  Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'proofbundle_peer_bridge|vertex_bridge_agent|claude|max2|pro1|grok|kimi|codex' } |
    Select-Object ProcessId,ParentProcessId,Name,CommandLine |
    Format-Table -AutoSize
}

function Show-Keys {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $BridgeRoot 'tools\export_bridge_key_index.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'key index export failed' }
  Write-Host "Key index: $KeyIndex"
  Get-Content -LiteralPath $KeyIndex -TotalCount 80
}

function Show-VertexStatus {
  $run = Join-Path $BridgeRoot 'run_receipts\vertex_bridge_agent'
  Write-Host 'Local Vertex watcher:'
  if (Test-Path (Join-Path $run 'vertex_bridge_agent.pid')) {
    $pidText = (Get-Content -Raw (Join-Path $run 'vertex_bridge_agent.pid')).Trim()
    Write-Host "pid_file=$pidText"
    if ($pidText -match '^\d+$') {
      Get-Process -Id ([int]$pidText) -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime,CPU,Path | Format-List
    }
  } else {
    Write-Host 'no local pid file'
  }
  Get-ChildItem $run -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 8 Name,Length,LastWriteTime | Format-Table -AutoSize

  Write-Host ''
  Write-Host 'Highmem Vertex watcher:'
  $remote = @'
cd /data/proofbundle/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508 || exit 2
pid=$(cat run_receipts/vertex_bridge_agent/vertex_bridge_agent.pid 2>/dev/null || true)
echo "pid_file=$pid"
if [ -n "$pid" ]; then ps -fp "$pid" || true; fi
ls -lt run_receipts/vertex_bridge_agent 2>/dev/null | head -8
node ./proofbundle_peer_bridge.mjs status --as vertex-gemini-bridge-agent-20260616
'@
  $remote | ssh -o BatchMode=yes -o ConnectTimeout=8 proofbundle-highmem 'timeout 45s bash -s'
}

function Start-Vertex {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $BridgeRoot 'tools\start_vertex_bridge_agent.ps1') -IntervalSeconds 60
}

Set-Location -LiteralPath $BridgeRoot

switch ($Command) {
  'help' { Show-Help }
  'agents' { Show-Agents }
  'keys' { Show-Keys }
  'status' { Invoke-Bridge @('status') }
  'verify' { Invoke-Bridge @('verify') }
  'tail' {
    $n = if ($Rest.Count -gt 0 -and $Rest[0] -match '^\d+$') { $Rest[0] } else { '20' }
    Invoke-Bridge @('tail','--limit',$n)
  }
  'watch' { Invoke-Bridge @('watch') }
  'watch-agent' {
    if ($Rest.Count -lt 1) { throw 'watch-agent requires identity' }
    Invoke-Bridge @('watch','--as',$Rest[0],'--persist','--notify','--notify-dir',$NotifyDir)
  }
  'inbox' {
    if ($Rest.Count -lt 1) { throw 'inbox requires identity' }
    & node (Join-Path $BridgeRoot 'tools\bridge_inbox.mjs') --as $Rest[0] --notify-dir $NotifyDir
  }
  'send' {
    $text = ($Rest -join ' ').Trim()
    if (-not $text) { throw 'send requires text' }
    Invoke-DeltaCli @('send','--to','all-bridge-agents','--type','ProofBundleBroadcast',$text)
  }
  'send-agent' {
    if ($Rest.Count -lt 2) { throw 'send-agent requires identity and text' }
    $identity = $Rest[0]
    $text = ($Rest[1..($Rest.Count - 1)] -join ' ').Trim()
    Invoke-Bridge @('send','--from',$identity,'--to','all-bridge-agents','--type','ProofBundleBroadcast','--identity-file',(Get-IdentityFile $identity),'--text',$text)
  }
  'launch' {
    if ($Rest.Count -lt 1) { throw 'launch requires alias from bridge_agents.json' }
    $count = if ($Rest.Count -gt 1 -and $Rest[1] -match '^\d+$') { [int]$Rest[1] } else { 1 }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $LaunchAgent $Rest[0] $count
  }
  'vertex-status' { Show-VertexStatus }
  'vertex-start' { Start-Vertex }
  'git-status' { git status --short --branch }
  'git-checkpoint' {
    $msg = ($Rest -join ' ').Trim()
    if (-not $msg) { $msg = "Bridge agent CLI and key index checkpoint $(Get-Date -Format yyyyMMddTHHmmss)" }
    git add BRIDGE_AGENTS.cmd BRIDGE_AGENT_ACCESS.md BRIDGE_AGENT_KEY_INDEX.md bridge_agents.json proofbundle_peer_bridge.mjs tools/bridge_agent_cli.ps1 tools/export_bridge_key_index.ps1 tools/vertex_bridge_agent.py tools/start_vertex_bridge_agent.ps1 bridge_identities/vertex-gemini-bridge-agent-20260616.identity.json bridge_state/send_claim_rejections.jsonl
    git commit -m $msg
  }
}
