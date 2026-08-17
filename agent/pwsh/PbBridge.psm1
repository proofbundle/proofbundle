# PbBridge.psm1 — ProofBundle agent-bridge PowerShell client
#
# Talks to the local HTTP broker from src/proofbundle/agent/bridge.mjs
# (default: http://127.0.0.1:8787). All cmdlets return parsed JSON or
# throw with the bridge's error envelope.
#
# Hash-based bridge architecture: every /seal call returns a sealed
# envelope whose `envelope_hash` is the SHA-256 of canonical JSON of
# the envelope (less signature); /verify re-derives and compares.
# Cross-agent coordination goes through /route -> /inbox/:id.
# The HTML verifier (proofbundle.html) is the thalamic layer: it
# consumes envelope JSON files produced by this client and re-verifies
# offline.

$script:PbBridgeBaseUrl = $env:PB_AGENT_BRIDGE_URL
if (-not $script:PbBridgeBaseUrl) { $script:PbBridgeBaseUrl = 'http://127.0.0.1:8787' }

function Get-PbBridgeUrl {
    return $script:PbBridgeBaseUrl
}

function Set-PbBridgeUrl {
    param([Parameter(Mandatory)][string]$Url)
    $script:PbBridgeBaseUrl = $Url
}

function Invoke-PbBridge {
    param(
        [Parameter(Mandatory)][ValidateSet('GET','POST')][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [hashtable]$Body = $null
    )
    $uri = "$script:PbBridgeBaseUrl$Path"
    try {
        if ($Method -eq 'GET') {
            $resp = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 10
        } else {
            $json = if ($Body) { $Body | ConvertTo-Json -Depth 64 -Compress } else { '{}' }
            $resp = Invoke-RestMethod -Uri $uri -Method Post -Body $json -ContentType 'application/json' -TimeoutSec 10
        }
        return $resp
    } catch {
        $msg = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
                throw "bridge $Method $Path failed: $msg -- $body"
            } catch {
                throw "bridge $Method $Path failed: $msg"
            }
        }
        throw "bridge $Method $Path failed: $msg"
    }
}

function Test-PbBridge {
    return Invoke-PbBridge -Method GET -Path '/health'
}

function Get-PbLineage {
    return Invoke-PbBridge -Method GET -Path '/lineage'
}

function Register-PbAgent {
    param([Parameter(Mandatory)][string]$AgentId)
    return Invoke-PbBridge -Method POST -Path '/register' -Body @{ agent_id = $AgentId }
}

function Get-PbIdentity {
    param([Parameter(Mandatory)][string]$AgentId)
    return Invoke-PbBridge -Method GET -Path "/identity/$AgentId"
}

function Send-PbSeal {
    param(
        [Parameter(Mandatory)][string]$AgentId,
        [Parameter(Mandatory)]$Payload,
        [string]$Type = 'work',
        [string]$To = $null,
        [switch]$Encrypt
    )
    $body = @{
        agentId     = $AgentId
        payload     = $Payload
        payloadType = $Type
    }
    if ($To)      { $body.to      = $To }
    if ($Encrypt) { $body.encrypt = $true }
    return Invoke-PbBridge -Method POST -Path '/seal' -Body $body
}

function Send-PbVerify {
    param([Parameter(Mandatory)]$Envelope)
    return Invoke-PbBridge -Method POST -Path '/verify' -Body @{ envelope = $Envelope }
}

function Send-PbRoute {
    param(
        [Parameter(Mandatory)][string]$To,
        [Parameter(Mandatory)]$Envelope
    )
    return Invoke-PbBridge -Method POST -Path '/route' -Body @{ to = $To; envelope = $Envelope }
}

function Receive-PbInbox {
    param(
        [Parameter(Mandatory)][string]$AgentId,
        [switch]$Keep
    )
    $path = "/inbox/$AgentId"
    if ($Keep) { $path += '?keep=1' }
    return Invoke-PbBridge -Method GET -Path $path
}

function Get-PbPrediction {
    param([Parameter(Mandatory)][int]$Seq)
    return Invoke-PbBridge -Method GET -Path "/predict/$Seq"
}

function Send-PbResolve {
    param(
        [Parameter(Mandatory)][int]$Seq,
        [Parameter(Mandatory)][ValidateSet('confirmed','falsified','expired')][string]$Outcome,
        [string]$Note = $null
    )
    $body = @{ seq = $Seq; outcome = $Outcome }
    if ($Note) { $body.note = $Note }
    return Invoke-PbBridge -Method POST -Path '/resolve' -Body $body
}

function Invoke-PbStamp {
    return Invoke-PbBridge -Method POST -Path '/stamp' -Body @{}
}

function Get-PbProof {
    param([Parameter(Mandatory)][int]$Seq)
    return Invoke-PbBridge -Method GET -Path "/proof/$Seq"
}

Export-ModuleMember -Function `
    Get-PbBridgeUrl, Set-PbBridgeUrl, Invoke-PbBridge, `
    Test-PbBridge, Get-PbLineage, `
    Register-PbAgent, Get-PbIdentity, `
    Send-PbSeal, Send-PbVerify, Send-PbRoute, Receive-PbInbox, `
    Get-PbPrediction, Send-PbResolve, Invoke-PbStamp, Get-PbProof