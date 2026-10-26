Add-Type -AssemblyName System.Drawing

$iconsDir = "C:\Users\giuli\OneDrive\Documenti\Progetti\gianlucazanello\site\assets\img\icons"
$srcDir = "C:\Users\giuli\OneDrive\Documenti\Progetti\gianlucazanello\site\assets\img"

function Get-Luminance([System.Drawing.Color]$c) {
  return ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
}

function Dilate-WhiteInk([System.Drawing.Bitmap]$src, [int]$radius = 2) {
  $w = $src.Width
  $h = $src.Height
  $ink = New-Object 'double[,]' $h, $w

  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $c = $src.GetPixel($x, $y)
      if ($c.A -lt 8) { $ink[$y, $x] = 0; continue }
      # Prefer alpha of white mask strokes; also accept bright luminance
      $strength = [Math]::Max($c.A / 255.0, (255 - (Get-Luminance $c)) / 255.0)
      if ((Get-Luminance $c) -gt 140 -or $c.A -gt 40) {
        $ink[$y, $x] = [Math]::Max($c.A / 255.0, 0.35)
      } else {
        $ink[$y, $x] = 0
      }
    }
  }

  $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $max = 0.0
      for ($dy = -$radius; $dy -le $radius; $dy++) {
        for ($dx = -$radius; $dx -le $radius; $dx++) {
          if (($dx * $dx + $dy * $dy) -gt ($radius * $radius + 0.5)) { continue }
          $nx = $x + $dx; $ny = $y + $dy
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { continue }
          if ($ink[$ny, $nx] -gt $max) { $max = $ink[$ny, $nx] }
        }
      }
      if ($max -gt 0.05) {
        $a = [int][Math]::Max(70, [Math]::Min(255, [Math]::Round($max * 255)))
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 255, 255, 255))
      } else {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  return $out
}

function Extract-WhiteMask([System.Drawing.Bitmap]$src, [int]$x0, [int]$y0, [int]$cw, [int]$ch) {
  $out = New-Object System.Drawing.Bitmap $cw, $ch, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $ch; $y++) {
    for ($x = 0; $x -lt $cw; $x++) {
      $c = $src.GetPixel($x0 + $x, $y0 + $y)
      $lum = Get-Luminance $c
      if ($lum -gt 90) {
        $a = [int][Math]::Max(60, [Math]::Min(255, [Math]::Round((($lum - 90) / 165.0) * 255)))
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 255, 255, 255))
      } else {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  return $out
}

# Thicken social icons
foreach ($name in @("instagram", "linkedin", "whatsapp")) {
  $path = Join-Path $iconsDir "$name.png"
  Write-Host "Thickening $name..."
  $src = [System.Drawing.Bitmap]::FromFile($path)
  $thick = Dilate-WhiteInk $src 3
  $src.Dispose()
  $tmp = Join-Path $iconsDir "$name-thick.png"
  $thick.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  $thick.Dispose()
  Remove-Item $path -Force
  Move-Item $tmp $path -Force
}

# Conservatorio: crop left emblem (~ square-ish left portion)
$logoPath = Join-Path $srcDir "conservatorio-nicolini-src.png"
Write-Host "Building nicolini icon..."
$logo = [System.Drawing.Bitmap]::FromFile($logoPath)
# Emblem is roughly left ~38% of width
$cropW = [int]($logo.Width * 0.40)
$cropH = $logo.Height
$emblem = Extract-WhiteMask $logo 0 0 $cropW $cropH
$logo.Dispose()

# Pad to square
$side = [Math]::Max($emblem.Width, $emblem.Height)
$square = New-Object System.Drawing.Bitmap $side, $side, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($square)
$g.Clear([System.Drawing.Color]::Transparent)
$ox = [int](($side - $emblem.Width) / 2)
$oy = [int](($side - $emblem.Height) / 2)
$g.DrawImage($emblem, $ox, $oy, $emblem.Width, $emblem.Height)
$g.Dispose()
$emblem.Dispose()

$thickNic = Dilate-WhiteInk $square 2
$square.Dispose()
$nicPath = Join-Path $iconsDir "nicolini.png"
$thickNic.Save($nicPath, [System.Drawing.Imaging.ImageFormat]::Png)
$thickNic.Dispose()

# SVG wrapper
$svg = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" fill="currentColor" role="img" aria-label="Conservatorio Nicolini">
  <defs>
    <mask id="mask-nicolini" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="#000"/>
      <image width="100" height="100" preserveAspectRatio="xMidYMid meet" href="nicolini.png" xlink:href="nicolini.png"/>
    </mask>
  </defs>
  <rect width="100" height="100" fill="currentColor" mask="url(#mask-nicolini)"/>
</svg>
"@
Set-Content -Path (Join-Path $iconsDir "nicolini.svg") -Value $svg -Encoding UTF8

Write-Host "done"
