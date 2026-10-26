Add-Type -AssemblyName System.Drawing

$base = "C:\Users\giuli\OneDrive\Documenti\Progetti\gianlucazanello\site\assets\img"
$outDir = Join-Path $base "icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Make-TransparentPng([string]$src, [string]$dest) {
  $img = [System.Drawing.Bitmap]::FromFile($src)
  $w = $img.Width
  $h = $img.Height
  $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $c = $img.GetPixel($x, $y)
      $lum = ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
      if ($lum -lt 178) {
        # White ink for SVG luminance masks (recolors via currentColor)
        $alpha = [int][Math]::Max(50, [Math]::Min(255, [Math]::Round(255 - ($lum / 178 * 210))))
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
      } else {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }

  $out.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()
  $out.Dispose()
}

function Build-Mask([string]$src, [int]$tw = 120) {
  $img = [System.Drawing.Bitmap]::FromFile($src)
  $th = [int][Math]::Max(1, [Math]::Round($img.Height * ($tw / $img.Width)))
  $small = New-Object System.Drawing.Bitmap $tw, $th
  $g = [System.Drawing.Graphics]::FromImage($small)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
  $g.DrawImage($img, 0, 0, $tw, $th)
  $g.Dispose()
  $img.Dispose()

  $mask = New-Object 'int[,]' $th, $tw
  for ($y = 0; $y -lt $th; $y++) {
    for ($x = 0; $x -lt $tw; $x++) {
      $c = $small.GetPixel($x, $y)
      $lum = ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
      $mask[$y, $x] = if ($lum -lt 165) { 1 } else { 0 }
    }
  }
  $small.Dispose()
  return @{ Mask = $mask; W = $tw; H = $th }
}

function Dilate-Mask($mask, [int]$tw, [int]$th) {
  $out = New-Object 'int[,]' $th, $tw
  for ($y = 0; $y -lt $th; $y++) {
    for ($x = 0; $x -lt $tw; $x++) {
      $v = $mask[$y, $x]
      if ($v -eq 1) { $out[$y, $x] = 1; continue }
      $hit = $false
      for ($dy = -1; $dy -le 1 -and -not $hit; $dy++) {
        for ($dx = -1; $dx -le 1; $dx++) {
          $nx = $x + $dx; $ny = $y + $dy
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $tw -or $ny -ge $th) { continue }
          if ($mask[$ny, $nx] -eq 1) { $hit = $true; break }
        }
      }
      $out[$y, $x] = if ($hit) { 1 } else { 0 }
    }
  }
  return $out
}

function Trace-Contours($mask, [int]$tw, [int]$th) {
  $dirs = @(
    @(1,0), @(1,1), @(0,1), @(-1,1),
    @(-1,0), @(-1,-1), @(0,-1), @(1,-1)
  )
  $visited = New-Object 'int[,]' $th, $tw
  $paths = New-Object System.Collections.Generic.List[object]

  function Test-Boundary([int]$x, [int]$y) {
    if ($mask[$y, $x] -ne 1) { return $false }
    foreach ($d in $dirs) {
      $nx = $x + $d[0]; $ny = $y + $d[1]
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $tw -or $ny -ge $th -or $mask[$ny, $nx] -ne 1) {
        return $true
      }
    }
    return $false
  }

  for ($sy = 1; $sy -lt $th - 1; $sy++) {
    for ($sx = 1; $sx -lt $tw - 1; $sx++) {
      if (-not (Test-Boundary $sx $sy)) { continue }
      if ($visited[$sy, $sx] -eq 1) { continue }

      $path = New-Object System.Collections.Generic.List[object]
      $x = $sx; $y = $sy; $dir = 0; $guard = 0

      do {
        $visited[$y, $x] = 1
        if (($path.Count % 2) -eq 0) { [void]$path.Add(@($x, $y)) }
        $found = $false
        for ($i = 0; $i -lt 8; $i++) {
          $nd = ($dir + $i + 6) % 8
          $nx = $x + $dirs[$nd][0]
          $ny = $y + $dirs[$nd][1]
          if ($nx -lt 1 -or $ny -lt 1 -or $nx -ge $tw - 1 -or $ny -ge $th - 1) { continue }
          if (Test-Boundary $nx $ny) {
            $x = $nx; $y = $ny; $dir = $nd; $found = $true; break
          }
        }
        if (-not $found) { break }
        $guard++
      } while (-not ($x -eq $sx -and $y -eq $sy) -and $guard -lt 12000)

      if ($path.Count -gt 22) { [void]$paths.Add($path) }
    }
  }

  $sorted = $paths | Sort-Object { $_.Count } -Descending | Select-Object -First 8
  return @($sorted)
}

function Write-TracedSvg($paths, [int]$tw, [int]$th, [string]$title, [string]$dest) {
  $sx = 100.0 / $tw
  $sy = 100.0 / $th
  $dAll = ""
  foreach ($path in $paths) {
    $d = ""
    for ($i = 0; $i -lt $path.Count; $i++) {
      $px = [Math]::Round($path[$i][0] * $sx, 2)
      $py = [Math]::Round($path[$i][1] * $sy, 2)
      if ($i -eq 0) { $d += "M$px $py " } else { $d += "L$px $py " }
    }
    $dAll += $d.Trim() + " Z "
  }

  $svg = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" role="img" aria-label="$title">
  <path fill-rule="evenodd" d="$($dAll.Trim())"/>
</svg>
"@
  Set-Content -Path $dest -Value $svg -Encoding UTF8
}

function Write-MaskSvg([string]$pngPath, [string]$title, [string]$dest) {
  $bytes = [System.IO.File]::ReadAllBytes($pngPath)
  $b64 = [Convert]::ToBase64String($bytes)
  # Luminance mask: drawing becomes currentColor shape, keeps handmade grain
  $svg = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" role="img" aria-label="$title">
  <defs>
    <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="#000"/>
      <image width="100" height="100" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,$b64"/>
    </mask>
  </defs>
  <rect width="100" height="100" fill="currentColor" mask="url(#m)"/>
</svg>
"@
  Set-Content -Path $dest -Value $svg -Encoding UTF8
}

$labels = @{
  instagram = "Instagram"
  linkedin = "LinkedIn"
  whatsapp = "WhatsApp"
}

foreach ($name in $labels.Keys) {
  $src = Join-Path $base "$name.png"
  $pngOut = Join-Path $outDir "$name.png"
  $svgMask = Join-Path $outDir "$name.svg"
  $svgTrace = Join-Path $outDir "$name-trace.svg"

  Write-Host "Processing $name..."
  Make-TransparentPng $src $pngOut
  Write-MaskSvg $pngOut $labels[$name] $svgMask

  $m = Build-Mask $src 110
  $dil = Dilate-Mask $m.Mask $m.W $m.H
  $paths = Trace-Contours $dil $m.W $m.H
  if ($paths -and $paths.Count -gt 0) {
    Write-TracedSvg $paths $m.W $m.H $labels[$name] $svgTrace
    Write-Host "  traced $($paths.Count) paths"
  }
  Write-Host "  wrote $svgMask"
}

Write-Host "done"
