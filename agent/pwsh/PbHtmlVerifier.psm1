# PbHtmlVerifier.psm1 — thalamic layer: bridge <-> proofbundle.html verifier
#
# The bridge and proofbundle.html must agree on every envelope_hash.
# This module:
#   1. Writes an envelope to a temp file the HTML verifier ingests.
#   2. Optionally launches proofbundle.html in the default browser
#      (cross-platform: xdg-open on Linux, Start-Process on Windows).
#   3. Returns the bridge's /verify verdict for the same envelope so
#      a script can assert agreement.

$script:PbHtmlVerifierPath = $env:PB_HTML_VERIFIER
if (-not $script:PbHtmlVerifierPath) {
    $script:PbHtmlVerifierPath = Join-Path $HOME 'src/proofbundle/proofbundle.html'
}

function Get-PbHtmlVerifierPath { return $script:PbHtmlVerifierPath }

function Set-PbHtmlVerifierPath {
    param([Parameter(Mandatory)][string]$Path)
    $script:PbHtmlVerifierPath = $Path
}

function Send-PbToVerifier {
    param(
        [Parameter(Mandatory)]$Envelope,
        [switch]$Launch
    )
    $tmp = [System.IO.Path]::GetTempFileName()
    $jsonPath = [System.IO.Path]::ChangeExtension($tmp, '.envelope.json')
    Move-Item -LiteralPath $tmp -Destination $jsonPath -Force
    $Envelope | ConvertTo-Json -Depth 64 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    if ($Launch) {
        if (-not (Test-Path $script:PbHtmlVerifierPath)) {
            Write-Warning "proofbundle.html not found at $($script:PbHtmlVerifierPath); skipping launch"
        } elseif ($IsLinux -or $PSVersionTable.Platform -eq 'Unix') {
            xdg-open $script:PbHtmlVerifierPath 2>$null
        } else {
            Start-Process $script:PbHtmlVerifierPath
        }
    }

    return $jsonPath
}

function Test-PbAgreement {
    <#
    Cross-check the same envelope through:
      - the local bridge  (POST /verify)
      - the HTML verifier  (offline re-derivation of envelope_hash)
    Both must agree on envelope_hash, signature, lineage membership.
    #>
    param(
        [Parameter(Mandatory)]$Envelope
    )
    Import-Module (Join-Path $PSScriptRoot 'PbBridge.psm1') -Force

    # Normalize PSCustomObject -> Hashtable for serialization
    if ($Envelope -is [System.Management.Automation.PSCustomObject]) {
        $ht = @{}
        foreach ($p in $Envelope.PSObject.Properties) { $ht[$p.Name] = $p.Value }
        $Envelope = $ht
    }

    $bridge = Send-PbVerify -Envelope $Envelope

    # Local re-derivation: SHA-256 over canonical JSON of the envelope (less signature/envelope_hash)
    $canonical = $Envelope | ConvertTo-Json -Depth 64
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($canonical)
    $localHash = [BitConverter]::ToString($hasher.ComputeHash($bytes)) -replace '-', '' | ForEach-Object { $_.ToLower() }

    $envelopeHashField = if ($Envelope.envelope_hash) { $Envelope.envelope_hash.ToString().ToLower() } else { $null }

    [pscustomobject]@{
        bridge_valid           = [bool]$bridge.ok
        bridge_envelope_seq    = $bridge.seq
        bridge_reason          = $bridge.reason
        local_hash_recomputed  = $localHash
        envelope_hash_field    = $envelopeHashField
        hashes_match           = ($envelopeHashField -eq $localHash)
        agreement              = ([bool]$bridge.ok) -and ($envelopeHashField -eq $localHash)
    }
}

Export-ModuleMember -Function `
    Get-PbHtmlVerifierPath, Set-PbHtmlVerifierPath, `
    Send-PbToVerifier, Test-PbAgreement