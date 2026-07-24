# Builds the Chrome Web Store upload ZIP from an allowlist of runtime files only.
# Dev/test/store assets are never included. Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File store\package.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot   # repo root (store\ is one level down)

# Read version from manifest.json
$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$version = $manifest.version
$name = "inner-peace-v$version.zip"
$outZip = Join-Path $PSScriptRoot $name

# Exactly what ships to users.
$files = @(
  "manifest.json",
  "background.js",
  "calm.html",
  "calm.js",
  "audio.js",
  "sites.js",
  "volume.js",
  "CREDITS.txt",
  "LICENSE"
)
$dirs = @("icons", "sounds")

# Build the ZIP with forward-slash entry names (Chrome Web Store rejects the
# backslash paths that Windows PowerShell's Compress-Archive produces).
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $outZip) { Remove-Item $outZip -Force }

# Collect (sourcePath, entryName) pairs.
$entries = @()
foreach ($f in $files) {
  $src = Join-Path $root $f
  if (Test-Path $src) { $entries += ,@($src, $f) }
  else { Write-Warning "missing runtime file: $f" }
}
foreach ($d in $dirs) {
  $srcDir = Join-Path $root $d
  if (-not (Test-Path $srcDir)) { Write-Warning "missing runtime dir: $d"; continue }
  Get-ChildItem $srcDir -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length).TrimStart('\','/').Replace('\','/')
    $entries += ,@($_.FullName, $rel)
  }
}

$zip = [System.IO.Compression.ZipFile]::Open($outZip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($e in $entries) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $e[0], $e[1],
      [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose() }

$sizeKb = [math]::Round((Get-Item $outZip).Length / 1KB, 1)
Write-Output "Built $name ($sizeKb KB) at:"
Write-Output "  $outZip"
Write-Output ""
Write-Output "Contents:"
$zipR = [System.IO.Compression.ZipFile]::OpenRead($outZip)
$zipR.Entries | ForEach-Object { Write-Output ("  " + $_.FullName) }
$zipR.Dispose()
