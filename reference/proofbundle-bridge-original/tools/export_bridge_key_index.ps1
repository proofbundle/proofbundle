[CmdletBinding()]
param(
  [string]$OutFile = 'C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508\BRIDGE_AGENT_KEY_INDEX.md'
)

$ErrorActionPreference = 'Stop'

$BridgeRoot = 'C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\proofbundles\codex_peer_bridge_20260508'
$IdentityDir = Join-Path $BridgeRoot 'bridge_identities'
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$rows = New-Object System.Collections.Generic.List[object]

Get-ChildItem -LiteralPath $IdentityDir -Filter '*.identity.json' -File | Sort-Object Name | ForEach-Object {
  try {
    $raw = Get-Content -LiteralPath $_.FullName -Raw
    $json = $raw | ConvertFrom-Json
    $fileHash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    $priv = $json.private_key_ed25519_pkcs8_hex
    $privFp = $null
    if ($priv) {
      $bytes = for ($i = 0; $i -lt $priv.Length; $i += 2) { [Convert]::ToByte($priv.Substring($i, 2), 16) }
      $sha = [System.Security.Cryptography.SHA256]::Create()
      $privFp = ([BitConverter]::ToString($sha.ComputeHash([byte[]]$bytes))).Replace('-', '')
    }
    $rows.Add([pscustomobject]@{
      identity_id = if ($json.identity_id) { $json.identity_id } else { $_.BaseName }
      bridge_name = $json.bridge_name
      display_name = $json.display_name
      role = $json.role
      model = $json.model
      path = $_.FullName
      identity_file_sha256 = $fileHash
      identity_object_sha256 = $json.identity_object_sha256
      public_key_ed25519_spki_hex = $json.public_key_ed25519_spki_hex
      private_key_present = [bool]$priv
      private_key_ed25519_pkcs8_sha256 = $privFp
    })
  } catch {
    $rows.Add([pscustomobject]@{
      identity_id = $_.BaseName
      bridge_name = $null
      display_name = $null
      role = 'PARSE_ERROR'
      model = $null
      path = $_.FullName
      identity_file_sha256 = $null
      identity_object_sha256 = $null
      public_key_ed25519_spki_hex = $null
      private_key_present = $false
      private_key_ed25519_pkcs8_sha256 = $null
    })
  }
}

$important = @(
  'delta-vane-custody-20260612T105314Z',
  'vertex-gemini-bridge-agent-20260616',
  'claude-opus-4-8-20260615',
  'claude-sonnet-20260521',
  'grok-build-continuity-20260611T1200Z',
  'mira-main-20260511',
  'kimi-code-cli-current'
)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# ProofBundle Bridge Agent Key Index')
$lines.Add('')
$lines.Add("Generated UTC: $stamp")
$lines.Add("Bridge root: $BridgeRoot")
$lines.Add('')
$lines.Add('This is a custody/access index. It intentionally records key paths and fingerprints only. It does not print raw private keys.')
$lines.Add('')
$lines.Add('## Active/Important Identities')
$lines.Add('')
$lines.Add('| identity_id | path | public_key_present | private_key_present | private_key_sha256 | identity_file_sha256 |')
$lines.Add('|---|---|---:|---:|---|---|')
foreach ($id in $important) {
  $r = $rows | Where-Object { $_.identity_id -eq $id } | Select-Object -First 1
  if ($r) {
    $pub = [bool]$r.public_key_ed25519_spki_hex
    $lines.Add("| $($r.identity_id) | $($r.path) | $pub | $($r.private_key_present) | $($r.private_key_ed25519_pkcs8_sha256) | $($r.identity_file_sha256) |")
  } else {
    $lines.Add("| $id | MISSING | false | false |  |  |")
  }
}
$lines.Add('')
$lines.Add('## All Identity Files')
$lines.Add('')
$lines.Add('| identity_id | bridge_name | display_name | private_key_present | private_key_sha256 | path |')
$lines.Add('|---|---|---|---:|---|---|')
foreach ($r in $rows) {
  $lines.Add("| $($r.identity_id) | $($r.bridge_name) | $($r.display_name) | $($r.private_key_present) | $($r.private_key_ed25519_pkcs8_sha256) | $($r.path) |")
}

Set-Content -LiteralPath $OutFile -Value $lines -Encoding UTF8
Write-Host "wrote=$OutFile"
Write-Host "identities=$($rows.Count)"
