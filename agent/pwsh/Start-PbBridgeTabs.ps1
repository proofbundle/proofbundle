#!/usr/bin/env pwsh
# Start-PbBridgeTabs.ps1 — tabbed pwsh client for the ProofBundle agent bridge.
#
# Each tab = one agent identity. Bridge on 127.0.0.1:8787 (default,
# override with -BridgeUrl). HTML verifier (proofbundle.html) is the
# thalamic layer; cross-check any envelope with Test-PbAgreement.
#
# REASONING / INFERENCE LAYERS RENDERED INLINE:
#   - tab strip + active tab identity
#   - bridge state (lineage tip, chain_ok, fork, merkle, OTS)
#   - this tab's last envelope + verdict (bridge + local SHA-256)
#   - thalamic agreement (bridge <-> HTML verifier)
#   All visible together. No Ctrl-O / Ctrl-T toggles.
#
# Hotkeys (PSReadLine):
#   Ctrl+1..9  switch to tab N
#   Ctrl+T     open a new agent tab (auto-register if bridge reachable)
#   Ctrl+W     close current tab
#   Ctrl+R     re-render
#   Ctrl+L     lineage tail (last 5 envelopes, full)
#   Ctrl+H     send current envelope to HTML verifier (always writes file)
#   Ctrl+V     verify current envelope (bridge + local hash)
#   Ctrl+G     grant summary: who am I, what's connected, last verdict
#   Ctrl+Q     quit

[CmdletBinding()]
param(
    [string[]]$SeedAgents = @('glm-5.2'),
    [string]$BridgeUrl = $env:PB_AGENT_BRIDGE_URL,
    [string]$HtmlVerifier = $env:PB_HTML_VERIFIER
)

$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $here 'PbBridge.psm1')  -Force
Import-Module (Join-Path $here 'PbHtmlVerifier.psm1') -Force

if ($BridgeUrl)    { Set-PbBridgeUrl       -Url $BridgeUrl }
if ($HtmlVerifier) { Set-PbHtmlVerifierPath -Path $HtmlVerifier }

# ── tab state ────────────────────────────────────────────────────────────

$script:Tabs      = New-Object System.Collections.Generic.List[object]
$script:ActiveTab = 0

function ActiveTab { return $script:Tabs[$script:ActiveTab] }

function New-Tab {
    param([string]$AgentId)
    $tab = [pscustomobject]@{
        agent_id      = $AgentId
        identity      = $null
        last_seq      = $null
        last_envelope = $null
        last_verdict  = $null
        inbox_count   = $null
    }
    try {
        $tab.identity = Get-PbIdentity -AgentId $AgentId
    } catch {
        try {
            $null = Register-PbAgent -AgentId $AgentId
            $tab.identity = Get-PbIdentity -AgentId $AgentId
        } catch {
            $tab.identity = $null
        }
    }
    $script:Tabs.Add($tab) | Out-Null
    return $script:Tabs.Count - 1
}

function Close-Tab {
    param([int]$Index)
    if ($script:Tabs.Count -le 1) { return $false }
    $script:Tabs.RemoveAt($Index)
    if ($script:ActiveTab -ge $script:Tabs.Count) {
        $script:ActiveTab = $script:Tabs.Count - 1
    }
    return $true
}

function Switch-Tab {
    param([int]$Index)
    if ($Index -lt 0 -or $Index -ge $script:Tabs.Count) { return }
    $script:ActiveTab = $Index
}
