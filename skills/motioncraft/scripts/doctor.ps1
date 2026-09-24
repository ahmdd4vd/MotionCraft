# motioncraft bootstrap check (Windows PowerShell). Works without Node. Detects only - never installs.
Write-Host "motioncraft bootstrap (Windows)"
$winget = Get-Command winget -ErrorAction SilentlyContinue
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $v = (& node -v); $maj = [int]($v.TrimStart('v').Split('.')[0])
  if ($maj -ge 18) { Write-Host "  OK   node      $v" } else { Write-Host "  MISS node      found $v, need 18+  ->  winget install OpenJS.NodeJS.LTS" }
} else { Write-Host "  MISS node      ->  winget install OpenJS.NodeJS.LTS   (or https://nodejs.org)" }
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Write-Host "  OK   ffmpeg" } else { Write-Host "  MISS ffmpeg    ->  winget install Gyan.FFmpeg   (optional: Remotion ships its own)" }
if (-not $winget) { Write-Host "  note: winget not found; use the website links instead." }
Write-Host ""
Write-Host "Nothing was installed. Ask the user before running any install command above."
if ($node) { Write-Host "Full check: node `"$PSScriptRoot\motioncraft.mjs`" doctor" }
