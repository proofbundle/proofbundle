param(
  [string]$OutDir = "D:\proofbundle_screen_monitor",
  [int]$IntervalSeconds = 5,
  [int]$Keep = 40
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$scriptPath = Join-Path $OutDir "screen_monitor_worker.ps1"
$htmlPath = Join-Path $OutDir "screen_monitor.html"
$pidPath = Join-Path $OutDir "screen_monitor.pid"
$statusPath = Join-Path $OutDir "screen_monitor_status.json"
$deleteLog = Join-Path $OutDir "screen_monitor_generated_deletions.jsonl"

$worker = @'
param(
  [string]$OutDir,
  [int]$IntervalSeconds,
  [int]$Keep
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$latestPath = Join-Path $OutDir "latest_screen.png"
$statusPath = Join-Path $OutDir "screen_monitor_status.json"
$deleteLog = Join-Path $OutDir "screen_monitor_generated_deletions.jsonl"

while ($true) {
  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
  $virtual = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bitmap = New-Object System.Drawing.Bitmap $virtual.Width, $virtual.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($virtual.Left, $virtual.Top, 0, 0, $virtual.Size)
    $capturePath = Join-Path $OutDir ("screen_{0}.png" -f $timestamp)
    $bitmap.Save($capturePath, [System.Drawing.Imaging.ImageFormat]::Png)
    Copy-Item -LiteralPath $capturePath -Destination $latestPath -Force

    $status = [ordered]@{
      status = "running"
      last_capture_utc = $timestamp
      latest = $latestPath
      capture = $capturePath
      keep = $Keep
      interval_seconds = $IntervalSeconds
      width = $virtual.Width
      height = $virtual.Height
    }
    $status | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statusPath -Encoding UTF8

    $captures = Get-ChildItem -LiteralPath $OutDir -Filter "screen_*.png" |
      Sort-Object LastWriteTimeUtc -Descending
    $stale = $captures | Select-Object -Skip $Keep
    foreach ($file in $stale) {
      $entry = [ordered]@{
        utc = (Get-Date).ToUniversalTime().ToString("o")
        action = "delete_generated_screen_capture"
        path = $file.FullName
        bytes = $file.Length
      }
      $entry | ConvertTo-Json -Compress | Add-Content -LiteralPath $deleteLog -Encoding UTF8
      Remove-Item -LiteralPath $file.FullName -Force
    }
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
  Start-Sleep -Seconds $IntervalSeconds
}
'@

$html = @'
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>ProofBundle Screen Monitor</title>
  <style>
    html, body { margin: 0; background: #101010; color: #f2f2f2; font-family: Segoe UI, Arial, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #202020; font-size: 14px; }
    img { width: 100vw; height: calc(100vh - 38px); object-fit: contain; display: block; background: #000; }
    code { color: #b8e986; }
  </style>
</head>
<body>
  <header>
    <div>ProofBundle Screen Monitor <code id="stamp"></code></div>
    <div>refreshes every 5s, rotating local captures on D:</div>
  </header>
  <img id="screen" alt="latest screen capture">
  <script>
    function refresh() {
      const now = Date.now();
      document.getElementById("stamp").textContent = new Date(now).toLocaleString();
      document.getElementById("screen").src = "latest_screen.png?t=" + now;
    }
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>
'@

Set-Content -LiteralPath $scriptPath -Value $worker -Encoding UTF8
Set-Content -LiteralPath $htmlPath -Value $html -Encoding UTF8

$existing = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
  Where-Object { $_.CommandLine -like "*screen_monitor_worker.ps1*" -and $_.CommandLine -like "*$OutDir*" }
if (-not $existing) {
  $proc = Start-Process -FilePath powershell.exe -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", $scriptPath,
      "-OutDir", $OutDir,
      "-IntervalSeconds", $IntervalSeconds,
      "-Keep", $Keep
    ) -WindowStyle Hidden -PassThru
  $proc.Id | Set-Content -LiteralPath $pidPath -Encoding ASCII
} else {
  ($existing | Select-Object -First 1).ProcessId | Set-Content -LiteralPath $pidPath -Encoding ASCII
}

Start-Sleep -Seconds 2
Start-Process $htmlPath

[ordered]@{
  out_dir = $OutDir
  html = $htmlPath
  pid = (Get-Content -LiteralPath $pidPath -Raw).Trim()
  status = $statusPath
  generated_deletion_log = $deleteLog
} | ConvertTo-Json -Depth 4
