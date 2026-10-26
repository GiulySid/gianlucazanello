# Copia i video dal dump WordPress in site/assets/video
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "www.gianlucazanello.it\wp-content\uploads"
$dst = Join-Path $root "site\assets\video"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Get-ChildItem "$src\2026\05","$src\2026\06" -Recurse -Include "*.mp4","*.mov" -ErrorAction SilentlyContinue |
  ForEach-Object { Copy-Item $_.FullName $dst -Force; Write-Host $_.Name }
Write-Host "Done -> $dst"
